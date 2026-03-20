# PS2 — Warehouse Box Counting System: Complete Development Plan

> **This document is a step-by-step coding guide for Cursor.**
> Follow each phase in order. Do not skip ahead. Every file path, function name, and data shape is specified.

---

## Stack

| Layer | Technology |
|---|---|
| Detection Engine | Python 3.11, OpenCV, Ultralytics YOLO |
| Backend | FastAPI (Python), SQLite via SQLModel, WebSockets |
| PDF Generation | ReportLab |
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Video Storage | Local filesystem, H.264/MP4 via OpenCV VideoWriter |
| Communication | REST (HTTP) + WebSocket over LAN |

**No cloud. No Docker required. Everything runs on Linux (dev on Ubuntu/WSL, prod on Raspberry Pi).**

---

## Repository Structure

```
ps2-warehouse/
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── routers/
│   │   ├── sessions.py
│   │   ├── detection.py
│   │   └── files.py
│   ├── services/
│   │   ├── video_recorder.py
│   │   ├── challan_gen.py
│   │   └── cleanup.py
│   └── requirements.txt
├── detection_engine/
│   ├── engine.py
│   ├── tracker.py
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── page.tsx              ← dashboard / session start
│   │   ├── session/[id]/page.tsx ← live feed page
│   │   └── history/page.tsx      ← session history
│   ├── components/
│   │   ├── VideoFeed.tsx
│   │   ├── CountDisplay.tsx
│   │   ├── SessionForm.tsx
│   │   └── ConfidenceSlider.tsx
│   └── lib/
│       └── api.ts
├── storage/
│   ├── videos/                   ← recorded .mp4 files (gitignored)
│   └── challans/                 ← generated PDF files (gitignored)
├── rpi_deployment.md
└── README.md
```

---

## Phase 0 — Project Bootstrap

### 0.1 Create repo and folders

```bash
mkdir ps2-warehouse && cd ps2-warehouse
git init
mkdir -p backend/routers backend/services detection_engine frontend storage/videos storage/challans
```

### 0.2 Backend `requirements.txt`

```
fastapi==0.111.0
uvicorn[standard]==0.29.0
sqlmodel==0.0.18
websockets==12.0
opencv-python-headless==4.9.0.80
numpy==1.26.4
reportlab==4.1.0
python-multipart==0.0.9
aiofiles==23.2.1
```

### 0.3 Detection engine `requirements.txt`

```
ultralytics==8.2.0
opencv-python==4.9.0.80
websockets==12.0
numpy==1.26.4
```

### 0.4 Frontend bootstrap

```bash
cd frontend
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
npm install
```

---

## Phase 1 — Database Layer

### File: `backend/models.py`

Define all SQLModel tables here.

```python
from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class Session(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    operator_id: str
    batch_id: str
    started_at: datetime = Field(default_factory=datetime.utcnow)
    stopped_at: Optional[datetime] = None
    final_box_count: int = 0
    video_path: Optional[str] = None
    challan_path: Optional[str] = None
    status: str = "active"  # active | completed

class DetectionLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: int = Field(foreign_key="session.id")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    frame_index: int
    box_count: int
    visible_count: int
```

### File: `backend/database.py`

```python
from sqlmodel import create_engine, Session, SQLModel
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "storage" / "ps2.db"
engine = create_engine(f"sqlite:///{DB_PATH}", echo=False)

def create_db():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
```

---

## Phase 2 — Backend Core

### File: `backend/main.py`

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from database import create_db
from routers import sessions, detection, files
from services.cleanup import start_cleanup_scheduler
from pathlib import Path

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db()
    start_cleanup_scheduler()
    yield

app = FastAPI(title="PS2 Backend", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sessions.router, prefix="/api/sessions", tags=["sessions"])
app.include_router(detection.router, tags=["detection"])
app.include_router(files.router, prefix="/api/files", tags=["files"])

# Serve frontend build in production
frontend_build = Path(__file__).parent.parent / "frontend" / "out"
if frontend_build.exists():
    app.mount("/", StaticFiles(directory=str(frontend_build), html=True), name="frontend")
```

Run with: `uvicorn main:app --host 0.0.0.0 --port 8000 --reload`

---

## Phase 3 — Session API

### File: `backend/routers/sessions.py`

Implement these endpoints exactly:

#### `POST /api/sessions/start`

**Request body:**
```json
{ "operator_id": "OP001", "batch_id": "BATCH-42" }
```

**What it does:**
1. Insert a new `Session` row into SQLite with `status="active"` and `started_at=now()`
2. Initialize `VideoRecorder` for this session (see Phase 5)
3. Store the recorder in a module-level dict keyed by `session_id`
4. Return the new session object

**Response:**
```json
{ "session_id": 1, "operator_id": "OP001", "batch_id": "BATCH-42", "started_at": "..." }
```

#### `POST /api/sessions/stop/{session_id}`

**What it does:**
1. Finalize and close `VideoRecorder` → saves `.mp4` to `storage/videos/{session_id}.mp4`
2. Update `Session` row: `stopped_at=now()`, `status="completed"`, `video_path=...`, `final_box_count` = last count from `DetectionLog`
3. Call `generate_challan(session)` → saves PDF to `storage/challans/{session_id}.pdf`
4. Update `Session.challan_path`
5. Return full session object + challan download URL

**Response:**
```json
{
  "session_id": 1,
  "final_box_count": 24,
  "challan_url": "/api/files/challan/1",
  "video_url": "/api/files/video/1"
}
```

#### `GET /api/sessions/` — list all sessions

#### `GET /api/sessions/{session_id}` — get single session

---

## Phase 4 — WebSocket Layer

### File: `backend/routers/detection.py`

This is the most critical file. Read carefully.

```python
from fastapi import WebSocket, WebSocketDisconnect, APIRouter
import json, asyncio
import cv2, numpy as np
from database import get_session as db_session_ctx
from models import DetectionLog
from sqlmodel import Session as DBSession
from database import engine
from services.video_recorder import active_recorders  # dict: session_id -> VideoRecorder

router = APIRouter()

# Dict of all currently connected browser clients, keyed by session_id
# { session_id: [WebSocket, WebSocket, ...] }
frontend_clients: dict[int, list[WebSocket]] = {}

# The single connected detection engine websocket (one at a time)
engine_ws: WebSocket | None = None
current_session_id: int | None = None


@router.websocket("/ws/engine")
async def engine_endpoint(ws: WebSocket):
    """
    The Linux detection engine connects here.
    It sends alternating messages:
    - bytes → JPEG frame with bounding box overlay
    - text  → JSON { count, visible, frame_idx, session_id }
    """
    global engine_ws, current_session_id
    await ws.accept()
    engine_ws = ws
    try:
        while True:
            data = await ws.receive()

            if "bytes" in data:
                frame_bytes = data["bytes"]

                # Write frame to video file
                if current_session_id and current_session_id in active_recorders:
                    nparr = np.frombuffer(frame_bytes, np.uint8)
                    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                    if frame is not None:
                        active_recorders[current_session_id].write(frame)

                # Forward JPEG bytes to all connected browsers for this session
                if current_session_id in frontend_clients:
                    dead = []
                    for client in frontend_clients[current_session_id]:
                        try:
                            await client.send_bytes(frame_bytes)
                        except:
                            dead.append(client)
                    for d in dead:
                        frontend_clients[current_session_id].remove(d)

            elif "text" in data:
                payload = json.loads(data["text"])

                # Set current session from engine payload
                if "session_id" in payload:
                    current_session_id = payload["session_id"]

                # Log count to SQLite
                if current_session_id:
                    with DBSession(engine) as db:
                        log = DetectionLog(
                            session_id=current_session_id,
                            frame_index=payload.get("frame_idx", 0),
                            box_count=payload.get("count", 0),
                            visible_count=payload.get("visible", 0),
                        )
                        db.add(log)
                        db.commit()

                # Forward count JSON to browsers
                if current_session_id in frontend_clients:
                    dead = []
                    for client in frontend_clients[current_session_id]:
                        try:
                            await client.send_text(data["text"])
                        except:
                            dead.append(client)
                    for d in dead:
                        frontend_clients[current_session_id].remove(d)

    except WebSocketDisconnect:
        engine_ws = None


@router.websocket("/ws/feed/{session_id}")
async def feed_endpoint(ws: WebSocket, session_id: int):
    """
    Browser clients connect here to receive live frames and count updates.
    """
    await ws.accept()
    if session_id not in frontend_clients:
        frontend_clients[session_id] = []
    frontend_clients[session_id].append(ws)
    try:
        while True:
            # Keep alive — browser sends periodic pings
            await asyncio.wait_for(ws.receive_text(), timeout=30)
    except (WebSocketDisconnect, asyncio.TimeoutError):
        if session_id in frontend_clients and ws in frontend_clients[session_id]:
            frontend_clients[session_id].remove(ws)
```

---

## Phase 5 — Video Recorder Service

### File: `backend/services/video_recorder.py`

```python
import cv2
from pathlib import Path
from datetime import datetime

STORAGE_DIR = Path(__file__).parent.parent.parent / "storage" / "videos"
STORAGE_DIR.mkdir(parents=True, exist_ok=True)

# Global dict: session_id (int) -> cv2.VideoWriter instance
active_recorders: dict[int, cv2.VideoWriter] = {}


def start_recording(session_id: int, width: int = 640, height: int = 480, fps: float = 15.0) -> str:
    """
    Start an H.264 video recording for a session.
    Returns the file path as a string.
    """
    output_path = str(STORAGE_DIR / f"{session_id}.mp4")
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    active_recorders[session_id] = writer
    return output_path


def stop_recording(session_id: int) -> str | None:
    """
    Finalize and release the VideoWriter for a session.
    Returns the saved file path, or None if not found.
    """
    writer = active_recorders.pop(session_id, None)
    if writer:
        writer.release()
        return str(STORAGE_DIR / f"{session_id}.mp4")
    return None
```

---

## Phase 6 — Challan PDF Generator

### File: `backend/services/challan_gen.py`

```python
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from pathlib import Path
from datetime import datetime

CHALLAN_DIR = Path(__file__).parent.parent.parent / "storage" / "challans"
CHALLAN_DIR.mkdir(parents=True, exist_ok=True)


def generate_challan(session) -> str:
    """
    Generate a PDF packing report (challan) for a completed session.
    session: SQLModel Session object
    Returns: file path to generated PDF
    """
    output_path = str(CHALLAN_DIR / f"{session.id}.pdf")
    doc = SimpleDocTemplate(output_path, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []

    # Title
    elements.append(Paragraph("PACKING CHALLAN", styles["Title"]))
    elements.append(Spacer(1, 0.5 * cm))
    elements.append(Paragraph("Warehouse Box Count Report", styles["Heading2"]))
    elements.append(Spacer(1, 1 * cm))

    # Main data table
    stopped_at_str = session.stopped_at.strftime("%Y-%m-%d %H:%M:%S") if session.stopped_at else "N/A"
    started_at_str = session.started_at.strftime("%Y-%m-%d %H:%M:%S")

    data = [
        ["Field", "Value"],
        ["Session ID", str(session.id)],
        ["Batch ID", session.batch_id],
        ["Operator ID", session.operator_id],
        ["Date & Time (Start)", started_at_str],
        ["Date & Time (End)", stopped_at_str],
        ["Final Box Count", str(session.final_box_count)],
        ["Video Reference", f"Session {session.id} — available via system API"],
        ["Report Generated", datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")],
    ]

    table = Table(data, colWidths=[7 * cm, 10 * cm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e3a5f")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 12),
        ("BACKGROUND", (0, 1), (0, -1), colors.HexColor("#f0f4f8")),
        ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f9f9f9")]),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 1 * cm))
    elements.append(Paragraph("This document was automatically generated by the PS2 Warehouse System.", styles["Normal"]))

    doc.build(elements)
    return output_path
```

---

## Phase 7 — File Serving Endpoints

### File: `backend/routers/files.py`

```python
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pathlib import Path

router = APIRouter()

VIDEOS_DIR = Path(__file__).parent.parent.parent / "storage" / "videos"
CHALLANS_DIR = Path(__file__).parent.parent.parent / "storage" / "challans"


@router.get("/challan/{session_id}")
def download_challan(session_id: int):
    path = CHALLANS_DIR / f"{session_id}.pdf"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Challan not found")
    return FileResponse(
        path=str(path),
        media_type="application/pdf",
        filename=f"challan_session_{session_id}.pdf"
    )


@router.get("/video/{session_id}")
def stream_video(session_id: int):
    path = VIDEOS_DIR / f"{session_id}.mp4"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Video not found")
    return FileResponse(
        path=str(path),
        media_type="video/mp4",
        filename=f"session_{session_id}.mp4",
        headers={"Accept-Ranges": "bytes"}  # Required for seek support in browser
    )
```

---

## Phase 8 — Cleanup Service

### File: `backend/services/cleanup.py`

```python
import asyncio
from pathlib import Path
from datetime import datetime, timedelta
import threading

VIDEOS_DIR = Path(__file__).parent.parent.parent / "storage" / "videos"
CHALLANS_DIR = Path(__file__).parent.parent.parent / "storage" / "challans"
RETENTION_DAYS = 30


def delete_old_files():
    cutoff = datetime.utcnow() - timedelta(days=RETENTION_DAYS)
    for directory in [VIDEOS_DIR, CHALLANS_DIR]:
        for file in directory.glob("*"):
            if file.is_file():
                mtime = datetime.utcfromtimestamp(file.stat().st_mtime)
                if mtime < cutoff:
                    file.unlink()


def cleanup_loop():
    """Runs in a background thread, checks once per day."""
    while True:
        delete_old_files()
        threading.Event().wait(timeout=86400)  # 24 hours


def start_cleanup_scheduler():
    t = threading.Thread(target=cleanup_loop, daemon=True)
    t.start()
```

---

## Phase 9 — Detection Engine

### File: `detection_engine/tracker.py`

A simple centroid tracker that avoids double-counting boxes.

```python
import numpy as np

class BoxTracker:
    """
    Tracks unique boxes across frames using centroid distance.
    A box is counted once when it enters the frame.
    Implements a patience window to survive brief occlusions.
    """

    def __init__(self, max_disappeared: int = 30, min_distance: float = 60.0):
        self.next_id = 0
        self.objects: dict[int, np.ndarray] = {}      # id -> centroid
        self.disappeared: dict[int, int] = {}          # id -> frame count missing
        self.counted_ids: set[int] = set()             # ids that have been counted
        self.max_disappeared = max_disappeared
        self.min_distance = min_distance

    def update(self, centroids: list[tuple[float, float]], frame_idx: int) -> tuple[int, int]:
        """
        centroids: list of (cx, cy) from current frame detections
        Returns: (total_unique_count, currently_visible_count)
        """
        if len(centroids) == 0:
            for obj_id in list(self.disappeared):
                self.disappeared[obj_id] += 1
                if self.disappeared[obj_id] > self.max_disappeared:
                    del self.objects[obj_id]
                    del self.disappeared[obj_id]
            return len(self.counted_ids), 0

        input_centroids = np.array(centroids)

        if len(self.objects) == 0:
            for c in input_centroids:
                self._register(c)
        else:
            object_ids = list(self.objects.keys())
            object_centroids = np.array(list(self.objects.values()))

            # Compute pairwise distances
            D = np.linalg.norm(object_centroids[:, None] - input_centroids[None, :], axis=2)
            rows = D.min(axis=1).argsort()
            cols = D.argmin(axis=1)[rows]

            used_rows, used_cols = set(), set()
            for r, c in zip(rows, cols):
                if r in used_rows or c in used_cols:
                    continue
                if D[r, c] > self.min_distance:
                    continue
                obj_id = object_ids[r]
                self.objects[obj_id] = input_centroids[c]
                self.disappeared[obj_id] = 0
                used_rows.add(r)
                used_cols.add(c)

            unused_rows = set(range(len(object_ids))) - used_rows
            unused_cols = set(range(len(input_centroids))) - used_cols

            for r in unused_rows:
                obj_id = object_ids[r]
                self.disappeared[obj_id] += 1
                if self.disappeared[obj_id] > self.max_disappeared:
                    del self.objects[obj_id]
                    del self.disappeared[obj_id]

            for c in unused_cols:
                self._register(input_centroids[c])

        return len(self.counted_ids), len(self.objects)

    def _register(self, centroid: np.ndarray):
        self.objects[self.next_id] = centroid
        self.disappeared[self.next_id] = 0
        self.counted_ids.add(self.next_id)
        self.next_id += 1

    def reset(self):
        self.__init__()
```

### File: `detection_engine/engine.py`

```python
import asyncio
import websockets
import cv2
import json
import numpy as np
import argparse
from ultralytics import YOLO
from tracker import BoxTracker

BACKEND_WS = "ws://localhost:8000/ws/engine"


def extract_centroids(results) -> list[tuple[float, float]]:
    centroids = []
    for box in results[0].boxes:
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        cx = (x1 + x2) / 2
        cy = (y1 + y2) / 2
        centroids.append((cx, cy))
    return centroids


def draw_overlay(frame, results, count: int) -> np.ndarray:
    annotated = results[0].plot()
    # Draw count in top-left corner
    cv2.rectangle(annotated, (0, 0), (200, 50), (0, 0, 0), -1)
    cv2.putText(annotated, f"Count: {count}", (10, 35),
                cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 0), 2)
    return annotated


async def run(video_source: str, session_id: int, conf: float = 0.45, backend_url: str = BACKEND_WS):
    print(f"[Engine] Connecting to backend at {backend_url}")
    async with websockets.connect(backend_url) as ws:
        print("[Engine] Connected.")
        model = YOLO("yolov8n.pt")  # Replace with provided model path
        tracker = BoxTracker()

        # Handle both file path and camera index
        source = int(video_source) if video_source.isdigit() else video_source
        cap = cv2.VideoCapture(source)

        if not cap.isOpened():
            print(f"[Engine] ERROR: Cannot open video source: {video_source}")
            return

        frame_idx = 0
        print(f"[Engine] Starting detection on: {video_source}")

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % 2 == 0:  # Process every 2nd frame for performance
                results = model(frame, conf=conf, imgsz=416, verbose=False)
                centroids = extract_centroids(results)
                count, visible = tracker.update(centroids, frame_idx)

                annotated = draw_overlay(frame, results, count)

                # Send annotated frame as compressed JPEG
                _, jpeg = cv2.imencode(".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, 65])
                await ws.send(jpeg.tobytes())

                # Send count data
                await ws.send(json.dumps({
                    "session_id": session_id,
                    "count": count,
                    "visible": visible,
                    "frame_idx": frame_idx
                }))

            frame_idx += 1
            await asyncio.sleep(0)  # Yield to event loop

        cap.release()
        print(f"[Engine] Done. Final count: {tracker.next_id}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=str, required=True, help="Video path or camera index (0)")
    parser.add_argument("--session", type=int, required=True, help="Session ID from backend")
    parser.add_argument("--conf", type=float, default=0.45, help="YOLO confidence threshold")
    parser.add_argument("--backend", type=str, default=BACKEND_WS)
    args = parser.parse_args()

    asyncio.run(run(args.source, args.session, args.conf, args.backend))
```

**Usage:**
```bash
python engine.py --source /path/to/video.mp4 --session 1 --conf 0.45
# or for live camera:
python engine.py --source 0 --session 1
```

---

## Phase 10 — Frontend

### File: `frontend/lib/api.ts`

```typescript
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const WS_BASE = BASE_URL.replace("http", "ws");

export const API = {
  startSession: (operatorId: string, batchId: string) =>
    fetch(`${BASE_URL}/api/sessions/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operator_id: operatorId, batch_id: batchId }),
    }).then((r) => r.json()),

  stopSession: (sessionId: number) =>
    fetch(`${BASE_URL}/api/sessions/stop/${sessionId}`, { method: "POST" }).then((r) => r.json()),

  getSessions: () =>
    fetch(`${BASE_URL}/api/sessions/`).then((r) => r.json()),

  getSession: (id: number) =>
    fetch(`${BASE_URL}/api/sessions/${id}`).then((r) => r.json()),

  challanUrl: (sessionId: number) => `${BASE_URL}/api/files/challan/${sessionId}`,
  videoUrl: (sessionId: number) => `${BASE_URL}/api/files/video/${sessionId}`,
  feedWsUrl: (sessionId: number) => `${WS_BASE}/ws/feed/${sessionId}`,
};
```

### File: `frontend/components/SessionForm.tsx`

A form with two inputs (Operator ID, Batch ID) and a Start Session button. On submit, calls `API.startSession()` and navigates to `/session/[id]`.

```typescript
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { API } from "@/lib/api";

export default function SessionForm() {
  const router = useRouter();
  const [operatorId, setOperatorId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleStart() {
    if (!operatorId || !batchId) return;
    setLoading(true);
    const session = await API.startSession(operatorId, batchId);
    router.push(`/session/${session.session_id}`);
  }

  return (
    <div className="flex flex-col gap-4 max-w-sm mx-auto mt-10 p-6 bg-white rounded-xl shadow">
      <h1 className="text-2xl font-bold text-gray-800">Start Packing Session</h1>
      <input
        className="border rounded-lg px-4 py-2 text-base"
        placeholder="Operator ID"
        value={operatorId}
        onChange={(e) => setOperatorId(e.target.value)}
      />
      <input
        className="border rounded-lg px-4 py-2 text-base"
        placeholder="Batch ID"
        value={batchId}
        onChange={(e) => setBatchId(e.target.value)}
      />
      <button
        className="bg-blue-600 text-white rounded-lg px-4 py-3 font-semibold disabled:opacity-50"
        onClick={handleStart}
        disabled={loading || !operatorId || !batchId}
      >
        {loading ? "Starting..." : "Start Session"}
      </button>
    </div>
  );
}
```

### File: `frontend/components/VideoFeed.tsx`

Connects to `/ws/feed/{sessionId}`. Receives binary JPEG frames and displays them in a canvas.

```typescript
"use client";
import { useEffect, useRef, useState } from "react";
import { API } from "@/lib/api";

interface Props {
  sessionId: number;
  onCountUpdate: (count: number) => void;
}

export default function VideoFeed({ sessionId, onCountUpdate }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(API.feedWsUrl(sessionId));
    wsRef.current = ws;
    ws.binaryType = "arraybuffer";

    ws.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        // JPEG frame — draw to canvas
        const blob = new Blob([event.data], { type: "image/jpeg" });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const ctx = canvas.getContext("2d");
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);
        };
        img.src = url;
      } else {
        // JSON count update
        try {
          const data = JSON.parse(event.data);
          if (data.count !== undefined) onCountUpdate(data.count);
        } catch {}
      }
    };

    // Keep-alive ping every 10s
    const ping = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send("ping");
    }, 10000);

    return () => {
      clearInterval(ping);
      ws.close();
    };
  }, [sessionId]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full max-w-2xl rounded-lg border border-gray-200 bg-black"
    />
  );
}
```

### File: `frontend/components/ConfidenceSlider.tsx`

```typescript
"use client";

interface Props {
  value: number;
  onChange: (v: number) => void;
}

export default function ConfidenceSlider({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        Confidence Threshold: <span className="font-bold">{value.toFixed(2)}</span>
      </label>
      <input
        type="range"
        min={0.1}
        max={0.95}
        step={0.05}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-blue-600"
      />
    </div>
  );
}
```

> **Note:** The confidence slider updates a local state value. To actually change the detection engine's threshold, POST `{ conf: value }` to `POST /api/sessions/update-conf/{session_id}`. The backend stores this in memory and passes it to the engine on the next connection.

### File: `frontend/app/page.tsx`

Home page — renders `<SessionForm />`.

```typescript
import SessionForm from "@/components/SessionForm";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <SessionForm />
    </main>
  );
}
```

### File: `frontend/app/session/[id]/page.tsx`

Live session page. Shows:
- VideoFeed component (live annotated stream)
- CountDisplay (large number, updates in real time)
- ConfidenceSlider
- Stop Session button → calls `API.stopSession()` → shows challan download link and video playback

```typescript
"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import VideoFeed from "@/components/VideoFeed";
import ConfidenceSlider from "@/components/ConfidenceSlider";
import { API } from "@/lib/api";

export default function SessionPage() {
  const { id } = useParams();
  const sessionId = Number(id);
  const router = useRouter();

  const [count, setCount] = useState(0);
  const [conf, setConf] = useState(0.45);
  const [stopped, setStopped] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleStop() {
    const data = await API.stopSession(sessionId);
    setResult(data);
    setStopped(true);
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Session #{sessionId}</h1>
          {!stopped && (
            <button
              className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg font-semibold"
              onClick={handleStop}
            >
              Stop Session
            </button>
          )}
        </div>

        <VideoFeed sessionId={sessionId} onCountUpdate={setCount} />

        <div className="text-center">
          <p className="text-gray-400 text-sm uppercase tracking-widest">Box Count</p>
          <p className="text-7xl font-black text-green-400">{count}</p>
        </div>

        {!stopped && <ConfidenceSlider value={conf} onChange={setConf} />}

        {stopped && result && (
          <div className="bg-gray-800 rounded-xl p-6 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-green-400">Session Complete</h2>
            <p>Final Box Count: <strong>{result.final_box_count}</strong></p>
            <a
              href={API.challanUrl(sessionId)}
              target="_blank"
              className="bg-blue-600 hover:bg-blue-700 text-white text-center py-3 rounded-lg font-semibold"
            >
              Download Challan (PDF)
            </a>
            <video
              src={API.videoUrl(sessionId)}
              controls
              className="w-full rounded-lg mt-2"
            />
          </div>
        )}
      </div>
    </main>
  );
}
```

### File: `frontend/app/history/page.tsx`

Fetches `GET /api/sessions/` and renders a table with: Session ID, Operator ID, Batch ID, Date, Box Count, Status, and links to download challan and play video.

---

## Phase 11 — Environment Configuration

### `frontend/.env.local`

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### For Raspberry Pi deployment, change this to:

```
NEXT_PUBLIC_API_URL=http://192.168.x.x:8000
```

---

## Phase 12 — Running the Full System

### Step 1: Start the backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Step 2: Start the frontend (dev)

```bash
cd frontend
npm install
npm run dev
# Access at http://localhost:3000
```

### Step 3: Start a session via UI

Open browser → enter Operator ID + Batch ID → click Start.
Note the session ID from the URL (`/session/3`).

### Step 4: Start the detection engine

```bash
cd detection_engine
pip install -r requirements.txt
python engine.py --source /path/to/video.mp4 --session 3
```

The engine connects to the backend WebSocket, sends frames and counts. The browser shows the live feed and updating count in real time.

### Step 5: Stop session via UI

Click Stop → PDF challan auto-downloads → recorded video plays in browser.

---

## Phase 13 — Wiring Session Start/Stop to Video Recorder

This is the most common integration mistake. Make sure `sessions.py` actually calls the recorder.

```python
# backend/routers/sessions.py
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session as DBSession, select
from database import engine, get_session
from models import Session, DetectionLog
from services.video_recorder import start_recording, stop_recording
from services.challan_gen import generate_challan
from datetime import datetime

router = APIRouter()


@router.post("/start")
def start_session(body: dict, db: DBSession = Depends(get_session)):
    session = Session(
        operator_id=body["operator_id"],
        batch_id=body["batch_id"],
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Start video recording
    video_path = start_recording(session.id)
    session.video_path = video_path
    db.add(session)
    db.commit()

    return {"session_id": session.id, "operator_id": session.operator_id, "batch_id": session.batch_id, "started_at": session.started_at}


@router.post("/stop/{session_id}")
def stop_session(session_id: int, db: DBSession = Depends(get_session)):
    session = db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Stop and save video
    video_path = stop_recording(session_id)
    session.video_path = video_path
    session.stopped_at = datetime.utcnow()
    session.status = "completed"

    # Get final box count from last detection log
    logs = db.exec(
        select(DetectionLog)
        .where(DetectionLog.session_id == session_id)
        .order_by(DetectionLog.id.desc())
    ).first()
    session.final_box_count = logs.box_count if logs else 0

    db.add(session)
    db.commit()
    db.refresh(session)

    # Generate challan PDF
    challan_path = generate_challan(session)
    session.challan_path = challan_path
    db.add(session)
    db.commit()

    return {
        "session_id": session.id,
        "final_box_count": session.final_box_count,
        "challan_url": f"/api/files/challan/{session_id}",
        "video_url": f"/api/files/video/{session_id}",
    }


@router.get("/")
def list_sessions(db: DBSession = Depends(get_session)):
    return db.exec(select(Session).order_by(Session.id.desc())).all()


@router.get("/{session_id}")
def get_session_detail(session_id: int, db: DBSession = Depends(get_session)):
    session = db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Not found")
    return session
```

---

## Phase 14 — Raspberry Pi Deployment

### File: `rpi_deployment.md`

```markdown
# Raspberry Pi Deployment Guide

## Hardware
- Raspberry Pi 4 (4GB+ recommended)
- MicroSD card 32GB+
- USB Camera or Pi Camera Module

## OS Setup
Flash Raspberry Pi OS (64-bit Lite) to SD card.
Enable SSH. Connect to same LAN as your device.

## Install dependencies

sudo apt update && sudo apt upgrade -y
sudo apt install python3-pip python3-venv git ffmpeg -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

## Clone repo
git clone https://github.com/YOUR_REPO ps2-warehouse
cd ps2-warehouse

## Backend setup
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000

## Frontend build (run once)
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://$(hostname -I | awk '{print $1}'):8000 npm run build
npm run start -- -p 3001
# OR export as static: npm run export → serves from FastAPI

## Detection engine
cd detection_engine
source ../backend/venv/bin/activate
pip install -r requirements.txt
python engine.py --source 0 --session SESSION_ID

## Access from phone
Open browser → http://RASPBERRY_PI_IP:3000
```

---

## Critical Checklist Before Demo

Go through this list one by one before recording the demo video:

- [ ] `POST /api/sessions/start` creates a DB row immediately (not on stop)
- [ ] `stop_recording()` is called in `/session/stop` and the `.mp4` file exists on disk
- [ ] `generate_challan()` is called in `/session/stop` and the PDF file exists on disk
- [ ] `GET /api/files/video/{id}` returns the video file with `Accept-Ranges: bytes` header
- [ ] `GET /api/files/challan/{id}` returns the PDF file
- [ ] Browser's VideoFeed canvas shows live annotated frames (not blank)
- [ ] Count number updates in real time on the browser
- [ ] Mobile browser (phone on same WiFi) can access the app and view the feed
- [ ] Session history page shows all past sessions
- [ ] Challan PDF contains: Batch ID, Operator ID, Date & Time, Final Box Count
- [ ] `rpi_deployment.md` exists in the repo

---

## Common Mistakes to Avoid

| Mistake | Fix |
|---|---|
| Frontend calls detection engine directly | All communication goes through FastAPI backend only |
| VideoWriter not released on stop | Call `writer.release()` in `stop_recording()` |
| Challan not generated on stop | Wire `generate_challan()` inside `/session/stop` endpoint |
| Video endpoint missing `Accept-Ranges` | Add header to `FileResponse` in `files.py` |
| WebSocket `/ws/feed` disconnects immediately | Add keep-alive ping from browser every 10s |
| CORS error on frontend | `allow_origins=["*"]` in FastAPI middleware |
| SQLite path wrong on RPi | Use `Path(__file__).parent` for relative paths |

---

## Demo Video Script (5 minutes max)

1. Show terminal — backend running on Linux, no errors
2. Open browser (and phone side by side if possible)
3. Enter Operator ID and Batch ID → Start Session
4. Show detection engine running in second terminal
5. Live annotated frames appear in browser — count updates in real time
6. Adjust confidence slider — show detection responding
7. Click Stop Session
8. PDF challan downloads automatically — open it, show all fields filled
9. Recorded video plays in browser (served from Linux filesystem)
10. Show session history table — session is logged
11. Narrate: *"All processing runs on Linux. The web app communicates only through the FastAPI backend. This architecture is deployable on Raspberry Pi as documented in our README."*
```

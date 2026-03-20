# PS2 — Warehouse Box Counting System: Complete Development Plan
> **This is a full agent-ready build plan for Cursor.**
> Follow each phase in order. Every file path, function signature, data shape, and UI component is specified. Do not skip phases.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Detection Engine | Python 3.11, OpenCV, Ultralytics YOLOv8 |
| Backend | FastAPI, SQLite via SQLModel, WebSockets |
| PDF Generation | ReportLab |
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion |
| Fonts | `Syne` (display/headings) + `DM Sans` (body) via Google Fonts |
| Icons | `lucide-react` |
| Video Storage | Local filesystem, H.264/MP4 via OpenCV VideoWriter |
| Transport | REST (HTTP) + WebSocket over LAN |

**No cloud. No Docker required. Runs entirely on Linux (dev: Ubuntu/WSL, prod: Raspberry Pi).**

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
│   │   ├── layout.tsx
│   │   ├── page.tsx                  ← Home / Start Session
│   │   ├── session/[id]/page.tsx     ← Live feed dashboard
│   │   └── history/page.tsx          ← Session history
│   ├── components/
│   │   ├── VideoFeed.tsx
│   │   ├── CountDisplay.tsx
│   │   ├── SessionForm.tsx
│   │   ├── ConfidenceSlider.tsx
│   │   ├── StatusBadge.tsx
│   │   └── SessionCard.tsx
│   ├── lib/
│   │   └── api.ts
│   └── public/
│       └── grid.svg
├── storage/
│   ├── videos/
│   └── challans/
├── rpi_deployment.md
└── README.md
```

---

## UI Design System

> Cursor must implement this design system across all pages. Every color, font, animation, and layout decision is specified. This is not optional.

### Visual Direction: **Industrial Control Room**

The app is a real-time operational dashboard for warehouse floor operators. The aesthetic is **dark, high-contrast, and data-dense** — inspired by SCADA control systems and mission-critical dashboards. It must feel like a professional tool built for real environments, not a generic web app.

Key qualities:
- Deep dark backgrounds with cool blue-grey panels
- Bright accent colors reserved for live/important data — green for counts, sky blue for actions
- `Syne` for all headings and numbers (geometric, technical character)
- `DM Sans` for body text and labels (clean and highly readable)
- Subtle dot-grid texture on the home page background
- Pulsing green glow ring around the count display when a session is live
- Smooth Framer Motion transitions on page entrance and on data state changes
- Every interactive element has clear hover + active feedback

### `tailwind.config.ts` — Add these extensions

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg:              "#0a0e1a",
        surface:         "#111827",
        panel:           "#1a2234",
        border:          "#1f2d44",
        accent:          "#38bdf8",
        success:         "#22c55e",
        warning:         "#f59e0b",
        muted:           "#4b5e7a",
        "text-primary":  "#e2e8f0",
        "text-secondary":"#8fa3be",
      },
      fontFamily: {
        display: ["Syne", "sans-serif"],
        body:    ["DM Sans", "sans-serif"],
      },
      boxShadow: {
        glow:        "0 0 24px rgba(34, 197, 94, 0.35)",
        "glow-blue": "0 0 20px rgba(56, 189, 248, 0.25)",
        panel:       "0 4px 24px rgba(0,0,0,0.4)",
      },
      keyframes: {
        pulse_ring: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(34,197,94,0.5)" },
          "50%":      { boxShadow: "0 0 0 14px rgba(34,197,94,0)" },
        },
        count_pop: {
          "0%":   { transform: "scale(1)" },
          "50%":  { transform: "scale(1.08)" },
          "100%": { transform: "scale(1)" },
        },
        fadeInUp: {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        pulse_ring: "pulse_ring 2s ease-in-out infinite",
        count_pop:  "count_pop 0.25s ease-out",
        fadeInUp:   "fadeInUp 0.4s ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;
```

### `app/layout.tsx` — Font setup

```tsx
import { Syne, DM_Sans } from "next/font/google";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-display",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable}`}>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <body className="bg-bg text-text-primary font-body antialiased">
        {children}
      </body>
    </html>
  );
}
```

### `globals.css` — Base additions

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom range slider styling */
input[type="range"] {
  -webkit-appearance: none;
  height: 4px;
  border-radius: 2px;
  background: #1f2d44;
  outline: none;
}
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 0 12px rgba(56,189,248,0.5);
  cursor: pointer;
}

/* Scrollbar styling */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: #0a0e1a; }
::-webkit-scrollbar-thumb { background: #1f2d44; border-radius: 3px; }
```

### `public/grid.svg` — Dot grid background

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">
  <circle cx="1" cy="1" r="1" fill="#1f2d44"/>
</svg>
```

---

## Page-by-Page UI Specification

### Page 1: Home `/` — Start Session

**Layout:** Full-screen centered, `bg-bg` with `bg-[url('/grid.svg')]` subtle dot texture.

**Elements (all animated `fadeInUp` with staggered `animation-delay`):**

1. **Brand block** — `Package` icon (lucide, accent blue, 36px) + heading `"PACKTRAQ"` in `font-display font-black text-4xl tracking-[0.2em] text-text-primary` + sub-label `"Warehouse Packing Session Control"` in `text-muted text-xs tracking-widest uppercase mt-1`

2. **Form card** — `bg-panel border border-border rounded-2xl p-8 w-full max-w-md shadow-panel`
   - Section label: `"NEW SESSION"` in `text-accent text-xs font-semibold tracking-widest uppercase mb-6`
   - Two inputs:
     - Operator ID — `User` icon prefix, placeholder `"e.g. OP-001"`
     - Batch ID — `Hash` icon prefix, placeholder `"e.g. BATCH-042"`
     - Input base class: `w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-primary font-body placeholder:text-muted focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all`
     - Icon wrapper: `absolute left-3 top-1/2 -translate-y-1/2 text-muted`
   - **Start Session button**: `w-full bg-accent text-bg font-display font-bold text-base rounded-xl py-4 hover:bg-sky-300 transition-all shadow-glow-blue active:scale-95 disabled:opacity-40`
   - Loading state: `<Loader2 className="animate-spin" />` + `"Initializing..."` text

3. **Footer**: `"View Session History →"` as a small `text-muted hover:text-text-primary` link to `/history`

---

### Page 2: Live Session `/session/[id]`

**Sticky Navbar** (`bg-bg/80 backdrop-blur border-b border-border`):
- Left: `Package` icon + `"PACKTRAQ"` wordmark + `"Session #[id]"` badge (`bg-surface border border-border rounded-full px-3 py-1 text-xs font-display`)
- Center: live status indicator — `<span className="w-2 h-2 rounded-full bg-success animate-pulse inline-block mr-2">` + `"LIVE"` in `text-success text-xs font-semibold tracking-widest uppercase` (hidden after stop)
- Right: `"Stop Session"` button — `bg-red-600/90 hover:bg-red-500 text-white font-display font-semibold rounded-xl px-6 py-2 transition-all active:scale-95` (hidden after stop)

**Main Content** — `grid grid-cols-1 lg:grid-cols-5 gap-6 p-6 max-w-7xl mx-auto`:

**Left column** `lg:col-span-3`:

1. **Video Feed panel** (`bg-panel border border-border rounded-2xl overflow-hidden shadow-panel`)
   - Header bar (`bg-surface px-4 py-2 flex items-center justify-between border-b border-border`):
     - Label: `"LIVE FEED"` in `font-display text-xs tracking-widest text-muted uppercase`
     - Right: `"640 × 480"` resolution text + live `fps` counter badge
   - Canvas fills the panel: `w-full aspect-video bg-black`
   - Disconnected overlay: semi-transparent dark overlay with `Wifi` icon + `"Waiting for detection engine..."` + `<Loader2 className="animate-spin">` 

2. **Confidence Threshold panel** (`bg-panel border border-border rounded-2xl p-5 mt-0`):
   - Header: `"DETECTION CONFIDENCE"` label (muted, uppercase) + current value pill `bg-accent/10 text-accent border border-accent/20 rounded-full px-3 py-0.5 text-sm font-display font-bold`
   - Custom `<input type="range">` styled per globals.css above
   - Track filled left portion: use a JS-updated CSS linear-gradient to show fill progress

**Right column** `lg:col-span-2`:

1. **Count Display card** (`bg-panel border border-border rounded-2xl p-8 text-center` + `animate-pulse_ring` when session active):
   - Label: `"BOXES COUNTED"` in `text-muted text-xs tracking-widest uppercase mb-4`
   - Number: `font-display font-black text-8xl text-success leading-none` — re-trigger `animate-count_pop` via `key={count}` prop trick
   - Sub-label: `"unique boxes detected"` in `text-muted text-sm mt-3`
   - Visible now indicator: `"[N] visible in frame"` in smaller `text-text-secondary text-sm`

2. **Session Info card** (`bg-panel border border-border rounded-2xl p-5 mt-0`):
   - `grid grid-cols-3 gap-4 divide-x divide-border`
   - Each stat cell: label `text-muted text-xs uppercase tracking-wide`, value `font-display font-semibold text-text-primary text-sm mt-1`
   - Stats: Operator ID / Batch ID / Elapsed (live `HH:MM:SS` counter using `useEffect` + `setInterval`)

3. **Session Complete panel** (replaces info card after stop, `motion.div` animated in):
   - `bg-panel border border-success/30 rounded-2xl p-6`
   - `CheckCircle2` icon in success green (32px) + `"SESSION COMPLETE"` heading
   - Final count: `font-display text-5xl font-black text-success`
   - Two action buttons:
     - `"Download Challan PDF"` — full-width, accent blue filled, `FileDown` icon left
     - `"Download Session Video"` — full-width, outline style (`border border-border text-text-primary hover:bg-surface`), `Video` icon left
   - `<video src={API.videoUrl(id)} controls className="w-full rounded-xl mt-4 border border-border">` auto-plays on mount

---

### Page 3: History `/history`

**Navbar**: Same sticky navbar, but replace Stop button with `"+ New Session"` button linking to `/`

**Content** (`max-w-6xl mx-auto p-6`):

- Heading: `"SESSION HISTORY"` in `font-display font-black text-3xl` + `"[N] sessions recorded"` sub-label in `text-muted text-sm`
- Sessions table (`bg-panel border border-border rounded-2xl overflow-hidden w-full`):

| Column | Class notes |
|---|---|
| `#` | `font-display font-bold text-accent` |
| `Operator` | With `User` icon, `text-text-primary` |
| `Batch ID` | `font-mono bg-surface border border-border rounded px-2 py-0.5 text-sm` |
| `Date` | Formatted `"12 Mar 2025, 14:32"`, `text-text-secondary` |
| `Box Count` | `font-display font-bold text-success text-lg` |
| `Status` | `<StatusBadge>` component |
| `Actions` | Icon buttons: `FileDown` (PDF) + `Play` (video link) |

Table rows: `hover:bg-surface/60 transition-colors`
Table header row: `bg-surface border-b border-border text-muted text-xs uppercase tracking-widest`

**`StatusBadge` component:**
```tsx
// status === "active"    → "● LIVE"  bg-accent/10 text-accent border-accent/20 animate-pulse
// status === "completed" → "✓ DONE"  bg-success/10 text-success border-success/20
// Base: rounded-full px-3 py-1 text-xs font-semibold border font-display tracking-widest
```

**Empty state:** Center of page, `Package` icon (muted, 64px) + `"No sessions recorded yet"` + `"Start your first packing session →"` button

---

## Phase 0 — Project Bootstrap

```bash
mkdir ps2-warehouse && cd ps2-warehouse
git init
mkdir -p backend/routers backend/services detection_engine frontend storage/videos storage/challans

# Backend
cd backend && python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Frontend
cd ../frontend
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
npm install framer-motion lucide-react
```

### `backend/requirements.txt`
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

### `detection_engine/requirements.txt`
```
ultralytics==8.2.0
opencv-python==4.9.0.80
websockets==12.0
numpy==1.26.4
```

---

## Phase 1 — Database Layer

### `backend/models.py`

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

### `backend/database.py`

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

### `backend/main.py`

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

frontend_build = Path(__file__).parent.parent / "frontend" / "out"
if frontend_build.exists():
    app.mount("/", StaticFiles(directory=str(frontend_build), html=True), name="frontend")
```

Run: `uvicorn main:app --host 0.0.0.0 --port 8000 --reload`

---

## Phase 3 — Session API

### `backend/routers/sessions.py`

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session as DBSession, select
from database import engine, get_session
from models import Session, DetectionLog
from services.video_recorder import start_recording, stop_recording
from services.challan_gen import generate_challan
from datetime import datetime
from pydantic import BaseModel

router = APIRouter()

class StartSessionRequest(BaseModel):
    operator_id: str
    batch_id: str


@router.post("/start")
def start_session(body: StartSessionRequest, db: DBSession = Depends(get_session)):
    session = Session(operator_id=body.operator_id, batch_id=body.batch_id)
    db.add(session)
    db.commit()
    db.refresh(session)

    video_path = start_recording(session.id)
    session.video_path = video_path
    db.add(session)
    db.commit()
    db.refresh(session)

    return {
        "session_id": session.id,
        "operator_id": session.operator_id,
        "batch_id": session.batch_id,
        "started_at": session.started_at.isoformat(),
    }


@router.post("/stop/{session_id}")
def stop_session(session_id: int, db: DBSession = Depends(get_session)):
    session = db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    video_path = stop_recording(session_id)
    session.video_path = video_path
    session.stopped_at = datetime.utcnow()
    session.status = "completed"

    last_log = db.exec(
        select(DetectionLog)
        .where(DetectionLog.session_id == session_id)
        .order_by(DetectionLog.id.desc())
    ).first()
    session.final_box_count = last_log.box_count if last_log else 0

    db.add(session)
    db.commit()
    db.refresh(session)

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

## Phase 4 — WebSocket Layer

### `backend/routers/detection.py`

```python
from fastapi import WebSocket, WebSocketDisconnect, APIRouter
import json, asyncio, cv2, numpy as np
from models import DetectionLog
from sqlmodel import Session as DBSession
from database import engine
from services.video_recorder import active_recorders

router = APIRouter()

frontend_clients: dict[int, list[WebSocket]] = {}
engine_ws: WebSocket | None = None
current_session_id: int | None = None


@router.websocket("/ws/engine")
async def engine_endpoint(ws: WebSocket):
    global engine_ws, current_session_id
    await ws.accept()
    engine_ws = ws
    try:
        while True:
            data = await ws.receive()

            if "bytes" in data:
                frame_bytes = data["bytes"]
                if current_session_id and current_session_id in active_recorders:
                    nparr = np.frombuffer(frame_bytes, np.uint8)
                    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                    if frame is not None:
                        active_recorders[current_session_id].write(frame)

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
                if "session_id" in payload:
                    current_session_id = payload["session_id"]

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
    await ws.accept()
    if session_id not in frontend_clients:
        frontend_clients[session_id] = []
    frontend_clients[session_id].append(ws)
    try:
        while True:
            await asyncio.wait_for(ws.receive_text(), timeout=30)
    except (WebSocketDisconnect, asyncio.TimeoutError):
        if session_id in frontend_clients and ws in frontend_clients[session_id]:
            frontend_clients[session_id].remove(ws)
```

---

## Phase 5 — Video Recorder

### `backend/services/video_recorder.py`

```python
import cv2
from pathlib import Path

STORAGE_DIR = Path(__file__).parent.parent.parent / "storage" / "videos"
STORAGE_DIR.mkdir(parents=True, exist_ok=True)

active_recorders: dict[int, cv2.VideoWriter] = {}


def start_recording(session_id: int, width: int = 640, height: int = 480, fps: float = 15.0) -> str:
    output_path = str(STORAGE_DIR / f"{session_id}.mp4")
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    active_recorders[session_id] = writer
    return output_path


def stop_recording(session_id: int) -> str | None:
    writer = active_recorders.pop(session_id, None)
    if writer:
        writer.release()
        return str(STORAGE_DIR / f"{session_id}.mp4")
    return None
```

---

## Phase 6 — Challan PDF Generator

### `backend/services/challan_gen.py`

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
    output_path = str(CHALLAN_DIR / f"{session.id}.pdf")
    doc = SimpleDocTemplate(output_path, pagesize=A4,
                            leftMargin=2*cm, rightMargin=2*cm,
                            topMargin=2*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph("PACKTRAQ — PACKING CHALLAN", styles["Title"]))
    elements.append(Spacer(1, 0.3*cm))
    elements.append(Paragraph("Warehouse Box Count Record", styles["Heading2"]))
    elements.append(Spacer(1, 1*cm))

    stopped_str = session.stopped_at.strftime("%d %b %Y, %H:%M:%S") if session.stopped_at else "—"
    started_str = session.started_at.strftime("%d %b %Y, %H:%M:%S")

    data = [
        ["Field", "Value"],
        ["Session ID",      f"#{session.id}"],
        ["Batch ID",        session.batch_id],
        ["Operator ID",     session.operator_id],
        ["Session Start",   started_str],
        ["Session End",     stopped_str],
        ["Final Box Count", str(session.final_box_count)],
        ["Video Reference", f"Session {session.id} — stored in system"],
        ["Generated On",    datetime.utcnow().strftime("%d %b %Y, %H:%M UTC")],
    ]

    table = Table(data, colWidths=[7*cm, 11*cm])
    table.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0), colors.HexColor("#0a0e1a")),
        ("TEXTCOLOR",     (0, 0), (-1, 0), colors.white),
        ("FONTNAME",      (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, 0), 11),
        ("BACKGROUND",    (0, 1), (0, -1), colors.HexColor("#f0f4f8")),
        ("FONTNAME",      (0, 1), (0, -1), "Helvetica-Bold"),
        ("GRID",          (0, 0), (-1, -1), 0.5, colors.HexColor("#cccccc")),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ("TOPPADDING",    (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
        ("LEFTPADDING",   (0, 0), (-1, -1), 10),
        ("BACKGROUND",    (1, 6), (1, 6), colors.HexColor("#dcfce7")),
        ("FONTNAME",      (1, 6), (1, 6), "Helvetica-Bold"),
        ("FONTSIZE",      (1, 6), (1, 6), 14),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 1.5*cm))
    elements.append(Paragraph(
        "Auto-generated by PackTraq Warehouse System. This document is a verified packing record.",
        styles["Normal"]
    ))

    doc.build(elements)
    return output_path
```

---

## Phase 7 — File Serving

### `backend/routers/files.py`

```python
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pathlib import Path

router = APIRouter()

VIDEOS_DIR   = Path(__file__).parent.parent.parent / "storage" / "videos"
CHALLANS_DIR = Path(__file__).parent.parent.parent / "storage" / "challans"


@router.get("/challan/{session_id}")
def download_challan(session_id: int):
    path = CHALLANS_DIR / f"{session_id}.pdf"
    if not path.exists():
        raise HTTPException(404, "Challan not found")
    return FileResponse(str(path), media_type="application/pdf",
                        filename=f"challan_session_{session_id}.pdf")


@router.get("/video/{session_id}")
def stream_video(session_id: int):
    path = VIDEOS_DIR / f"{session_id}.mp4"
    if not path.exists():
        raise HTTPException(404, "Video not found")
    return FileResponse(str(path), media_type="video/mp4",
                        filename=f"session_{session_id}.mp4",
                        headers={"Accept-Ranges": "bytes"})
```

---

## Phase 8 — Cleanup Service

### `backend/services/cleanup.py`

```python
import threading
from pathlib import Path
from datetime import datetime, timedelta

VIDEOS_DIR   = Path(__file__).parent.parent.parent / "storage" / "videos"
CHALLANS_DIR = Path(__file__).parent.parent.parent / "storage" / "challans"
RETENTION_DAYS = 30


def delete_old_files():
    cutoff = datetime.utcnow() - timedelta(days=RETENTION_DAYS)
    for directory in [VIDEOS_DIR, CHALLANS_DIR]:
        for f in directory.glob("*"):
            if f.is_file():
                if datetime.utcfromtimestamp(f.stat().st_mtime) < cutoff:
                    f.unlink()


def cleanup_loop():
    while True:
        delete_old_files()
        threading.Event().wait(timeout=86400)


def start_cleanup_scheduler():
    threading.Thread(target=cleanup_loop, daemon=True).start()
```

---

## Phase 9 — Detection Engine

### `detection_engine/tracker.py`

```python
import numpy as np

class BoxTracker:
    def __init__(self, max_disappeared: int = 30, min_distance: float = 60.0):
        self.next_id = 0
        self.objects: dict[int, np.ndarray] = {}
        self.disappeared: dict[int, int] = {}
        self.counted_ids: set[int] = set()
        self.max_disappeared = max_disappeared
        self.min_distance = min_distance

    def update(self, centroids, frame_idx):
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
                used_rows.add(r), used_cols.add(c)
            for r in set(range(len(object_ids))) - used_rows:
                obj_id = object_ids[r]
                self.disappeared[obj_id] += 1
                if self.disappeared[obj_id] > self.max_disappeared:
                    del self.objects[obj_id]
                    del self.disappeared[obj_id]
            for c in set(range(len(input_centroids))) - used_cols:
                self._register(input_centroids[c])

        return len(self.counted_ids), len(self.objects)

    def _register(self, centroid):
        self.objects[self.next_id] = centroid
        self.disappeared[self.next_id] = 0
        self.counted_ids.add(self.next_id)
        self.next_id += 1

    def reset(self):
        self.__init__()
```

### `detection_engine/engine.py`

```python
import asyncio, websockets, cv2, json, numpy as np, argparse
from ultralytics import YOLO
from tracker import BoxTracker

BACKEND_WS = "ws://localhost:8000/ws/engine"


def extract_centroids(results):
    return [((b[0]+b[2])/2, (b[1]+b[3])/2)
            for b in [r.tolist() for r in results[0].boxes.xyxy]]


def draw_overlay(frame, results, count):
    annotated = results[0].plot()
    cv2.rectangle(annotated, (0, 0), (210, 52), (10, 14, 26), -1)
    cv2.putText(annotated, f"COUNT: {count}", (10, 36),
                cv2.FONT_HERSHEY_SIMPLEX, 1.0, (34, 197, 94), 2)
    return annotated


async def run(video_source, session_id, conf=0.45, backend_url=BACKEND_WS):
    print(f"[Engine] Connecting to {backend_url}")
    async with websockets.connect(backend_url) as ws:
        model = YOLO("yolov8n.pt")
        tracker = BoxTracker()
        source = int(video_source) if video_source.isdigit() else video_source
        cap = cv2.VideoCapture(source)

        if not cap.isOpened():
            print(f"[Engine] Cannot open: {video_source}")
            return

        frame_idx = 0
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            if frame_idx % 2 == 0:
                results = model(frame, conf=conf, imgsz=416, verbose=False)
                centroids = extract_centroids(results)
                count, visible = tracker.update(centroids, frame_idx)
                annotated = draw_overlay(frame, results, count)
                _, jpeg = cv2.imencode(".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, 65])
                await ws.send(jpeg.tobytes())
                await ws.send(json.dumps({
                    "session_id": session_id,
                    "count": count,
                    "visible": visible,
                    "frame_idx": frame_idx,
                }))
            frame_idx += 1
            await asyncio.sleep(0)

        cap.release()
        print(f"[Engine] Done. Total unique: {tracker.next_id}")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--source",  required=True)
    p.add_argument("--session", type=int, required=True)
    p.add_argument("--conf",    type=float, default=0.45)
    p.add_argument("--backend", default=BACKEND_WS)
    args = p.parse_args()
    asyncio.run(run(args.source, args.session, args.conf, args.backend))
```

**Usage:**
```bash
python engine.py --source /path/to/video.mp4 --session 1 --conf 0.45
python engine.py --source 0 --session 1   # live camera
```

---

## Phase 10 — Frontend API Client

### `frontend/lib/api.ts`

```typescript
const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const WS   = BASE.replace(/^http/, "ws");

export const API = {
  startSession: (operatorId: string, batchId: string) =>
    fetch(`${BASE}/api/sessions/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operator_id: operatorId, batch_id: batchId }),
    }).then((r) => r.json()),

  stopSession: (id: number) =>
    fetch(`${BASE}/api/sessions/stop/${id}`, { method: "POST" }).then((r) => r.json()),

  getSessions: () => fetch(`${BASE}/api/sessions/`).then((r) => r.json()),
  getSession:  (id: number) => fetch(`${BASE}/api/sessions/${id}`).then((r) => r.json()),

  challanUrl: (id: number) => `${BASE}/api/files/challan/${id}`,
  videoUrl:   (id: number) => `${BASE}/api/files/video/${id}`,
  feedWsUrl:  (id: number) => `${WS}/ws/feed/${id}`,
};
```

---

## Phase 11 — Frontend Components

> Implement each component following the UI Design System at the top of this document exactly. All classes listed below reference the Tailwind config extensions defined above.

### `frontend/components/SessionForm.tsx`
- State: `operatorId`, `batchId`, `loading (bool)`
- On submit → `API.startSession()` → `router.push('/session/' + result.session_id)`
- Wrap card in `motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }}`
- Both inputs use relative wrapper + absolute icon (`text-muted`) on the left + `pl-10` on input
- Button shows `<Loader2 className="animate-spin w-4 h-4 mr-2" />` during loading

### `frontend/components/VideoFeed.tsx`
- `useRef` for canvas and WebSocket
- `ws.binaryType = "arraybuffer"`
- Binary → Blob → createObjectURL → Image → `ctx.drawImage()` → `URL.revokeObjectURL()`
- JSON text → parse → call `onCountUpdate(data.count)` and `onVisibleUpdate(data.visible)`
- Keep-alive: `setInterval(() => ws.send("ping"), 10000)`
- Disconnected state: `isConnected` boolean, show overlay when false

### `frontend/components/CountDisplay.tsx`
- Props: `count: number`, `visible: number`, `active: boolean`
- Pulsing ring: conditional `animate-pulse_ring` on outer wrapper when `active`
- Count pop animation: use `key={count}` on the number `<span>` so React re-mounts it and re-triggers the CSS animation `animate-count_pop`

### `frontend/components/ConfidenceSlider.tsx`
- Props: `value: number`, `onChange: (v: number) => void`
- Update the track fill: `style={{ background: \`linear-gradient(to right, #38bdf8 ${pct}%, #1f2d44 ${pct}%)\` }}`
- Show value badge right-aligned

### `frontend/components/StatusBadge.tsx`
- Props: `status: "active" | "completed"`
- Active: `bg-accent/10 text-accent border border-accent/20 animate-pulse`
- Completed: `bg-success/10 text-success border border-success/20`
- Base: `rounded-full px-3 py-1 text-xs font-display font-semibold border tracking-widest inline-flex items-center gap-1.5`

### `frontend/app/page.tsx`
- Full-screen: `min-h-screen bg-bg bg-[url('/grid.svg')] flex flex-col items-center justify-center px-4`
- Render brand block + `<SessionForm />` + history link

### `frontend/app/session/[id]/page.tsx`
- `"use client"` — all interactive
- State: `count`, `visible`, `conf`, `stopped`, `result`, `sessionInfo`, `elapsedSeconds`
- `useEffect` on mount: `API.getSession(id)` → set `sessionInfo`
- Elapsed timer: `setInterval(() => setElapsedSeconds(s => s+1), 1000)` while not stopped
- Format elapsed: `HH:MM:SS`
- Stop handler: `API.stopSession(id)` → `setStopped(true)` → `setResult(data)`
- Layout: sticky navbar + `max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-5 gap-6`

### `frontend/app/history/page.tsx`
- `"use client"`
- `useEffect` → `API.getSessions()` → `setSessions`
- Table with columns as specified in UI spec above
- `<a href={API.challanUrl(s.id)} target="_blank">` for PDF download
- `<a href={API.videoUrl(s.id)} target="_blank">` for video

---

## Phase 12 — Environment Config

### `frontend/.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

For Raspberry Pi deployment: `NEXT_PUBLIC_API_URL=http://192.168.x.x:8000`

---

## Phase 13 — Running the System

```bash
# Terminal 1 — Backend
cd backend && source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 — Frontend (dev)
cd frontend && npm run dev
# → http://localhost:3000

# Terminal 3 — Detection Engine (after starting session via UI)
cd detection_engine && source ../backend/venv/bin/activate
python engine.py --source /path/to/video.mp4 --session SESSION_ID
```

---

## Phase 14 — Raspberry Pi Deployment

### `rpi_deployment.md`

```markdown
# Raspberry Pi Deployment — PackTraq

## Requirements
- Raspberry Pi 4 (4GB RAM recommended)
- 32GB+ microSD (Raspberry Pi OS 64-bit Lite)
- USB webcam or Pi Camera Module
- Same LAN as client devices

## System setup
sudo apt update && sudo apt upgrade -y
sudo apt install python3-pip python3-venv git ffmpeg -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

## Clone and install
git clone https://github.com/YOUR_REPO ps2-warehouse && cd ps2-warehouse

cd backend && python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 &

cd ../frontend && npm install
NEXT_PUBLIC_API_URL=http://$(hostname -I | awk '{print $1}'):8000 npm run build
npm run start -- -p 3000 &

## Run detection
cd ../detection_engine && source ../backend/venv/bin/activate
python engine.py --source 0 --session SESSION_ID

## Access from any device
http://RASPBERRY_PI_IP:3000
```

---

## Critical Checklist

- [ ] `POST /api/sessions/start` inserts SQLite row immediately (not on stop)
- [ ] `stop_recording()` called in `/session/stop` → `.mp4` exists on disk
- [ ] `generate_challan()` called in `/session/stop` → `.pdf` exists on disk
- [ ] `GET /api/files/video/{id}` has `Accept-Ranges: bytes` header
- [ ] `GET /api/files/challan/{id}` returns downloadable PDF
- [ ] Canvas in VideoFeed shows live annotated frames (not blank)
- [ ] Count number updates in real time in browser
- [ ] Phone on same WiFi can access and use the app
- [ ] Session history lists all sessions with working PDF + video links
- [ ] Challan PDF contains: Session ID, Batch ID, Operator ID, Date & Time, Final Box Count
- [ ] All UI uses `Syne` for headings/numbers, `DM Sans` for body
- [ ] Dark theme applied consistently (`bg-bg`, `bg-panel`, `bg-surface`)
- [ ] Count display glows and pulses when session is active
- [ ] Framer Motion entrance animation on home page card
- [ ] Session complete panel animates in after stop
- [ ] `rpi_deployment.md` exists in repo root

---

## Common Mistakes

| Mistake | Fix |
|---|---|
| Frontend calls detection engine directly | All traffic must go through FastAPI only |
| VideoWriter not released on stop | Call `writer.release()` in `stop_recording()` |
| Challan not generated | Wire `generate_challan()` inside `/session/stop` |
| Video cannot seek in browser | Add `Accept-Ranges: bytes` to FileResponse |
| WebSocket drops immediately | Keep-alive ping from browser every 10s |
| CORS error | `allow_origins=["*"]` in FastAPI CORSMiddleware |
| Count stays at 0 | Verify engine sends `session_id` in JSON payload |
| Mobile layout broken | Use `lg:` breakpoints, test on real phone |
| Fonts not loading | Confirm `variable` props on html element in layout.tsx |
| Canvas blank | Check `binaryType = "arraybuffer"` on WebSocket |

---

## Demo Video Script (5 minutes)

1. Terminal: backend running on Linux, no errors
2. Open browser on laptop + phone side-by-side on same WiFi
3. Home page: PackTraq logo, dark dot-grid background — enter Operator ID + Batch ID → Start
4. Second terminal: run `engine.py --source video.mp4 --session ID`
5. Live annotated frames stream to canvas — green count number ticks up with glow pulse
6. Slide confidence threshold — detection responds in real time
7. Click Stop Session
8. PDF auto-downloads — open it, show Batch ID / Operator / Count / Date all filled
9. Recorded video plays inline in browser (served from Linux filesystem)
10. Navigate to History — session logged in table with status badge
11. Show same session page on phone browser
12. Narrate: *"All inference runs on Linux. The web app communicates only through the FastAPI backend. This architecture is fully deployable on Raspberry Pi as documented in rpi_deployment.md."*

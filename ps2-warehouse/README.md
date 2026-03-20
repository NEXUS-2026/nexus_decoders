# PS2 — Warehouse Box Counting System

A complete warehouse packing management system that integrates YOLO-based box counting with a web application for session management, real-time video streaming, and automated packing report generation.

## Features

- **Real-time Box Detection** — YOLOv8 object detection with centroid tracking to avoid double-counting
- **Live Video Streaming** — WebSocket-based streaming from detection engine to browser
- **Session Management** — Start/stop packing sessions with operator and batch tracking
- **Packing Challan** — Auto-generated PDF reports with session details and final box count
- **Video Recording** — Compressed H.264 video saved during sessions with detection overlay
- **Auto-Cleanup** — Old recordings auto-deleted after 30 days
- **Deployable on Raspberry Pi** — Runs entirely on Linux, no cloud required

## Stack

| Layer | Technology |
|---|---|
| Detection Engine | Python, OpenCV, Ultralytics YOLO |
| Backend | FastAPI, SQLite (SQLModel), WebSockets |
| PDF Generation | ReportLab |
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Video Storage | Local filesystem, H.264/MP4 |

## Quick Start

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# Access at http://localhost:3000
```

### 3. Detection Engine

```bash
cd detection_engine
pip install -r requirements.txt
python engine.py --source /path/to/video.mp4 --session SESSION_ID --model /path/to/box_detection.pt
# Or for live camera:
python engine.py --source 0 --session SESSION_ID
```

## Workflow

1. Open browser → Enter Operator ID + Batch ID → Start Session
2. Start detection engine with the session ID
3. Live annotated frames + real-time box count appear in browser
4. Click Stop → PDF challan auto-generates → recorded video available for playback
5. View all past sessions in History page

## Deployment

See [rpi_deployment.md](./rpi_deployment.md) for Raspberry Pi setup instructions.

"""
Server-side live stream processor.
Receives raw frames from the Raspberry Pi relay via WebSocket,
runs YOLO detection, and pushes annotated frames + counts to
connected frontend clients through the existing WebSocket infrastructure.

Flow: Phone (IP Webcam) -> Raspi (relay) -> Backend (this) -> Frontend
"""
import json
import sys
import time
from pathlib import Path

# Track active live stream sessions
# session_id -> { "status": ..., "count": ..., "visible": ..., "frames_processed": ... }
live_stream_sessions: dict[int, dict] = {}


def get_or_create_session_state(session_id: int) -> dict:
    """Get or initialize tracking state for a live stream session."""
    if session_id not in live_stream_sessions:
        live_stream_sessions[session_id] = {
            "status": "waiting",  # waiting | connected | running | stopped | error
            "count": 0,
            "visible": 0,
            "frames_processed": 0,
            "tracker": None,
            "model": None,
            "conf": 0.45,
            "last_db_write": 0,
        }
    return live_stream_sessions[session_id]


def init_session_model(session_id: int, conf: float = 0.45, model_path: str = "yolov8n.pt"):
    """Initialize the YOLO model and tracker for a session (lazy loaded on first frame)."""
    state = get_or_create_session_state(session_id)
    state["conf"] = conf

    if state["model"] is None:
        from ultralytics import YOLO
        from services.tracker import BoxTracker
        
        state["model"] = YOLO(model_path)
        state["tracker"] = BoxTracker()
        print(f"[LiveStream] Model loaded for session {session_id}")

    state["status"] = "waiting"
    return state


async def process_frame(session_id: int, frame_bytes: bytes) -> tuple[bytes, dict] | None:
    """
    Process a single raw frame from the Raspi relay.
    Runs YOLO detection, draws overlay, returns annotated JPEG + count data.
    """
    import cv2
    import numpy as np
    from services.video_recorder import active_recorders
    from sqlmodel import Session as DBSession
    from database import engine as db_engine
    from models import DetectionLog

    state = live_stream_sessions.get(session_id)
    if not state or not state.get("model"):
        return None

    if state["status"] == "waiting":
        state["status"] = "running"

    action = state.get("action", "run")
    if action == "stop":
        return None
    elif action == "pause":
        return None
    elif action == "reset":
        if state["tracker"]:
            state["tracker"].reset()
        state["count"] = 0
        state["visible"] = 0
        state["frames_processed"] = 0
        state["action"] = "run"
        return None

    frame_idx = state["frames_processed"]

    # Only process every 2nd frame for performance
    if frame_idx % 2 != 0:
        state["frames_processed"] = frame_idx + 1
        return None

    # Decode the raw JPEG frame from Raspi
    nparr = np.frombuffer(frame_bytes, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if frame is None:
        return None

    model = state["model"]
    tracker = state["tracker"]
    conf = state["conf"]

    # Run YOLO detection
    results = model(frame, conf=conf, imgsz=416, verbose=False)

    # Extract centroids
    centroids = []
    for box in results[0].boxes:
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        cx = (x1 + x2) / 2
        cy = (y1 + y2) / 2
        centroids.append((cx, cy))

    count, visible = tracker.update(centroids, frame_idx)

    # Draw overlay on annotated frame
    annotated = results[0].plot()
    cv2.rectangle(annotated, (0, 0), (210, 52), (10, 14, 26), -1)
    cv2.putText(
        annotated, f"COUNT: {count}", (10, 36),
        cv2.FONT_HERSHEY_SIMPLEX, 1.0, (34, 197, 94), 2
    )

    # Write to video recorder if active
    if session_id in active_recorders:
        active_recorders[session_id].write(annotated)

    # Encode annotated frame as JPEG
    _, jpeg = cv2.imencode(".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, 70])
    annotated_bytes = jpeg.tobytes()

    # Count data JSON
    count_data = {
        "session_id": session_id,
        "count": count,
        "visible": visible,
        "frame_idx": frame_idx,
    }

    # Update state
    state["count"] = count
    state["visible"] = visible
    state["frames_processed"] = frame_idx + 1

    # Log to DB every ~2 seconds
    now = time.time()
    if now - state["last_db_write"] >= 2.0:
        state["last_db_write"] = now
        try:
            with DBSession(db_engine) as db:
                log = DetectionLog(
                    session_id=session_id,
                    frame_index=frame_idx,
                    box_count=count,
                    visible_count=visible,
                )
                db.add(log)
                db.commit()
        except Exception:
            pass

    return annotated_bytes, count_data


def stop_live_stream(session_id: int) -> bool:
    """Mark a live stream session as stopped."""
    state = live_stream_sessions.get(session_id)
    if not state:
        return False

    state["status"] = "stopped"

    # Final DB log
    try:
        from sqlmodel import Session as DBSession
        from database import engine as db_engine
        from models import DetectionLog

        with DBSession(db_engine) as db:
            log = DetectionLog(
                session_id=session_id,
                frame_index=state.get("frames_processed", 0),
                box_count=state.get("count", 0),
                visible_count=state.get("visible", 0),
            )
            db.add(log)
            db.commit()
    except Exception as e:
        print(f"[LiveStream] Error writing final log: {e}")

    print(f"[LiveStream] Stopped session {session_id}, final count: {state.get('count', 0)}")
    return True


def get_live_stream_status(session_id: int) -> dict | None:
    """Get the current status of a live stream session."""
    state = live_stream_sessions.get(session_id)
    if not state:
        return None
    return {
        "status": state["status"],
        "count": state["count"],
        "visible": state["visible"],
        "frames_processed": state["frames_processed"],
    }

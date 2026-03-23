"""
Server-side detection runner for uploaded videos.
Processes video using YOLO, sends frames & counts via WebSocket infrastructure.
"""
import cv2
import json
import numpy as np
import threading
import asyncio
import sys
import time
from pathlib import Path
from datetime import datetime

from services.tracker import BoxTracker

from sqlmodel import Session as DBSession
from database import engine as db_engine
from models import DetectionLog, Session
from services.video_recorder import active_recorders

# Track running detection tasks: session_id -> {"status": ..., "progress": ..., "count": ...}
detection_tasks: dict[int, dict] = {}


def run_detection_on_video(
    session_id: int,
    video_path: str,
    conf: float = 0.45,
    model_path: str = "yolov8n.pt",
):
    """
    Run YOLO detection on an uploaded video file in a background thread.
    Results are saved to the DB and forwarded to connected WebSocket clients.
    """
    detection_tasks[session_id] = {
        "status": "running",
        "progress": 0,
        "count": 0,
        "visible": 0,
        "total_frames": 0,
        "processed_frames": 0,
    }

    def _run():
        try:
            # Lazy import ultralytics — only needed when actually running detection
            from ultralytics import YOLO

            model = YOLO(model_path)
            tracker = BoxTracker()

            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                detection_tasks[session_id]["status"] = "error"
                detection_tasks[session_id]["error"] = f"Cannot open video: {video_path}"
                return

            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            fps = cap.get(cv2.CAP_PROP_FPS) or 15.0
            detection_tasks[session_id]["total_frames"] = total_frames

            frame_idx = 0
            count = 0
            visible = 0

            while cap.isOpened():
                action = detection_tasks[session_id].get("action", "run")
                if action == "stop":
                    break
                elif action == "pause":
                    time.sleep(0.5)
                    continue
                elif action == "reset":
                    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    tracker.reset()
                    frame_idx = 0
                    count = 0
                    visible = 0
                    detection_tasks[session_id]["action"] = "run"
                    continue

                ret, frame = cap.read()
                if not ret:
                    break

                if frame_idx % 2 == 0:  # Process every 2nd frame
                    results = model(frame, conf=conf, imgsz=416, verbose=False)

                    # Extract centroids
                    centroids = []
                    for box in results[0].boxes:
                        x1, y1, x2, y2 = box.xyxy[0].tolist()
                        cx = (x1 + x2) / 2
                        cy = (y1 + y2) / 2
                        centroids.append((cx, cy))

                    count, visible = tracker.update(centroids, frame_idx)

                    # Draw overlay
                    annotated = results[0].plot()
                    cv2.rectangle(annotated, (0, 0), (210, 52), (10, 14, 26), -1)
                    cv2.putText(
                        annotated, f"COUNT: {count}", (10, 36),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.0, (34, 197, 94), 2
                    )

                    # Write to video recorder if active
                    if session_id in active_recorders:
                        active_recorders[session_id].write(annotated)

                    # Encode annotated frame as JPEG for WebSocket clients
                    _, jpeg = cv2.imencode(
                        ".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, 70]
                    )
                    frame_bytes = jpeg.tobytes()

                    # Forward to WebSocket clients via detection router
                    try:
                        from routers.detection import frontend_clients
                        if session_id in frontend_clients:
                            loop = _get_or_create_event_loop()
                            for client in list(frontend_clients.get(session_id, [])):
                                try:
                                    future = asyncio.run_coroutine_threadsafe(
                                        client.send_bytes(frame_bytes), loop
                                    )
                                    # Throttle the loop by waiting for send to push to socket
                                    future.result(timeout=0.05)
                                except Exception:
                                    pass

                            # Send count data as JSON
                            count_json = json.dumps({
                                "session_id": session_id,
                                "count": count,
                                "visible": visible,
                                "frame_idx": frame_idx,
                            })
                            for client in list(frontend_clients.get(session_id, [])):
                                try:
                                    asyncio.run_coroutine_threadsafe(
                                        client.send_text(count_json), loop
                                    ).result(timeout=0.05)
                                except Exception:
                                    pass
                    except Exception:
                        pass

                    # Log to DB every 10th processed frame to avoid DB spam
                    if (frame_idx // 2) % 5 == 0:
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

                frame_idx += 1
                detection_tasks[session_id]["processed_frames"] = frame_idx
                detection_tasks[session_id]["progress"] = (
                    int((frame_idx / total_frames) * 100) if total_frames > 0 else 0
                )
                detection_tasks[session_id]["count"] = count
                detection_tasks[session_id]["visible"] = visible

            cap.release()

            # Final DB log
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

                    # Auto-stop the session
                    session = db.get(Session, session_id)
                    if session and session.status != "completed":
                        from services.video_recorder import stop_recording
                        from services.challan_gen import generate_challan

                        video_out = stop_recording(session_id)
                        session.video_path = video_out
                        session.stopped_at = datetime.utcnow()
                        session.status = "completed"
                        session.final_box_count = count
                        db.add(session)
                        db.commit()
                        db.refresh(session)

                        challan_path = generate_challan(session)
                        session.challan_path = challan_path
                        db.add(session)
                        db.commit()
            except Exception as e:
                print(f"[DetectionRunner] Error finalizing session {session_id}: {e}")

            detection_tasks[session_id]["status"] = "completed"
            detection_tasks[session_id]["progress"] = 100
            print(f"[DetectionRunner] Done. Session {session_id}, final count: {count}")

        except Exception as e:
            detection_tasks[session_id]["status"] = "error"
            detection_tasks[session_id]["error"] = str(e)
            print(f"[DetectionRunner] Error: {e}")

    thread = threading.Thread(target=_run, daemon=True)
    thread.start()
    return thread


# Store reference to the main asyncio event loop
_main_loop = None


def set_main_loop(loop):
    global _main_loop
    _main_loop = loop


def _get_or_create_event_loop():
    global _main_loop
    if _main_loop is not None:
        return _main_loop
    try:
        return asyncio.get_running_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        _main_loop = loop
        return loop

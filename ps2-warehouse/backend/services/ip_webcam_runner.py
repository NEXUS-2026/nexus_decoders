"""
IP Webcam Stream Processor
Connects directly to an IP webcam URL (e.g., http://192.168.1.5), 
captures frames, runs YOLO detection, and pushes annotated frames 
to connected frontend clients through WebSocket infrastructure.

Flow: IP Webcam -> Backend (this) -> Frontend
"""
import json
import sys
import time
import asyncio
import threading
import logging
from pathlib import Path
import cv2
import numpy as np
import requests
from urllib.parse import urlparse

# Set up logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Track active IP webcam sessions
# session_id -> { "status": ..., "count": ..., "visible": ..., "frames_processed": ..., "thread": ... }
ip_webcam_sessions: dict[int, dict] = {}


def get_or_create_ip_session_state(session_id: int) -> dict:
    """Get or initialize tracking state for an IP webcam session."""
    if session_id not in ip_webcam_sessions:
        ip_webcam_sessions[session_id] = {
            "status": "waiting",  # waiting | connected | running | stopped | error
            "count": 0,
            "visible": 0,
            "frames_processed": 0,
            "tracker": None,
            "model": None,
            "conf": 0.45,
            "last_db_write": 0,
            "thread": None,
            "stop_event": threading.Event(),
        }
    return ip_webcam_sessions[session_id]


def init_ip_session_model(session_id: int, conf: float = 0.45, model_path: str = "yolov8n.pt"):
    """Initialize the YOLO model and tracker for an IP webcam session."""
    state = get_or_create_ip_session_state(session_id)
    state["conf"] = conf

    if state["model"] is None:
        from ultralytics import YOLO
        from services.tracker import BoxTracker
        
        state["model"] = YOLO(model_path)
        state["tracker"] = BoxTracker()
        print(f"[IPWebcam] Model loaded for session {session_id}")

    state["status"] = "waiting"
    return state


def process_ip_frame(session_id: int, frame: np.ndarray) -> tuple[np.ndarray, dict] | None:
    """
    Process a single frame from IP webcam.
    Runs YOLO detection, draws overlay, returns annotated frame + count data.
    """
    from services.video_recorder import active_recorders
    from sqlmodel import Session as DBSession
    from database import engine as db_engine
    from models import DetectionLog

    state = ip_webcam_sessions.get(session_id)
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

    return annotated, count_data


def ip_webcam_stream_worker(session_id: int, webcam_url: str):
    """Worker thread that continuously captures frames from IP webcam."""
    state = get_or_create_ip_session_state(session_id)
    stop_event = state["stop_event"]
    
    try:
        # Initialize model
        init_ip_session_model(session_id)
        
        # Parse webcam URL - we know /video works, so use it directly
        parsed_url = urlparse(webcam_url)
        if not parsed_url.path.endswith('/video'):
            if parsed_url.path.endswith('/'):
                stream_url = f"{webcam_url}video"
            else:
                stream_url = f"{webcam_url}/video"
        else:
            stream_url = webcam_url
            
        print(f"[IPWebcam] Connecting to {stream_url}")
        logger.info(f"[IPWebcam] Attempting to open video stream from: {stream_url}")
        
        # Test if URL is accessible first (but don't block on it)
        try:
            import requests
            response = requests.get(stream_url, timeout=2)
            content_type = response.headers.get('Content-Type', '').lower()
            print(f"[IPWebcam] URL test response: {response.status_code}, Content-Type: {content_type}")
            logger.info(f"[IPWebcam] URL test response: {response.status_code}, Content-Type: {content_type}")
            
            # Check if it's actually a video stream
            if 'text/html' in content_type:
                print(f"[IPWebcam] Warning: URL returns HTML, not video stream. Trying common endpoints...")
                logger.warning(f"[IPWebcam] URL returns HTML, not video stream. Trying common endpoints...")
                
                # Try common video endpoints
                base_url = webcam_url.rstrip('/')
                common_endpoints = ["/video", "/stream", "/mjpg/video.mjpg", "/cam", "/live"]
                
                for endpoint in common_endpoints:
                    test_url = f"{base_url}{endpoint}"
                    try:
                        test_response = requests.get(test_url, timeout=2)
                        test_content_type = test_response.headers.get('Content-Type', '').lower()
                        if 'video' in test_content_type or 'multipart' in test_content_type or 'mjpg' in test_content_type:
                            stream_url = test_url
                            print(f"[IPWebcam] Found working video endpoint: {stream_url}")
                            logger.info(f"[IPWebcam] Found working video endpoint: {stream_url}")
                            break
                    except:
                        continue
                        
        except Exception as e:
            print(f"[IPWebcam] URL test failed (continuing anyway): {e}")
            logger.warning(f"[IPWebcam] URL test failed (continuing anyway): {e}")
            # Don't return here - try OpenCV anyway
        
        # Open video stream with different backends if needed
        cap = cv2.VideoCapture(stream_url)
        
        # If first attempt fails, try with different backends
        if not cap.isOpened():
            print(f"[IPWebcam] First attempt failed, trying different backends...")
            
            # Try with explicit backend
            backends = [
                cv2.CAP_FFMPEG,
                cv2.CAP_GSTREAMER,
                cv2.CAP_DSHOW,  # Windows DirectShow
            ]
            
            for backend in backends:
                print(f"[IPWebcam] Trying backend: {backend}")
                cap = cv2.VideoCapture(stream_url, backend)
                if cap.isOpened():
                    print(f"[IPWebcam] Success with backend: {backend}")
                    break
        
        # Add some debugging about the VideoCapture
        print(f"[IPWebcam] VideoCapture backend: {cap.getBackendName()}")
        logger.info(f"[IPWebcam] VideoCapture backend: {cap.getBackendName()}")
        
        if not cap.isOpened():
            print(f"[IPWebcam] Failed to open stream: {stream_url}")
            logger.error(f"[IPWebcam] Failed to open video stream from {stream_url}")
            state["status"] = "error"
            return
            
        state["status"] = "connected"
        print(f"[IPWebcam] Connected to webcam for session {session_id}")
        
        while not stop_event.is_set():
            try:
                ret, frame = cap.read()
                if not ret:
                    print(f"[IPWebcam] Failed to read frame from {stream_url}. Retrying in 1 second...")
                    logger.warning(f"[IPWebcam] Failed to read frame from {stream_url}. Retrying in 1 second...")
                    time.sleep(1)
                    continue
            except Exception as e:
                print(f"[IPWebcam] Error reading frame: {e}")
                logger.error(f"[IPWebcam] Error reading frame: {e}")
                time.sleep(1)
                continue
                
            # Process frame
            result = process_ip_frame(session_id, frame)
            if result:
                annotated_frame, count_data = result
                
                # Debug: Log that we processed a frame
                if state["frames_processed"] % 30 == 0:  # Log every 30 frames
                    print(f"[IPWebcam] Processed frame {state['frames_processed']}, count: {count_data.get('count', 0)}")
                    
                # Send to frontend clients via WebSocket - simplified approach
                try:
                    from routers.detection import frontend_clients
                    
                    if session_id in frontend_clients and frontend_clients[session_id]:
                        # Encode and send frame
                        _, jpeg = cv2.imencode(".jpg", annotated_frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
                        frame_bytes = jpeg.tobytes()
                        
                        # Send to all connected clients
                        clients_to_remove = []
                        for i, client in enumerate(frontend_clients[session_id]):
                            try:
                                # Send frame bytes
                                client.send_bytes(frame_bytes)
                                # Send count data
                                client.send_text(json.dumps(count_data))
                                
                            except Exception as e:
                                print(f"[IPWebcam] Failed to send to client {i}: {e}")
                                clients_to_remove.append(i)
                        
                        # Remove disconnected clients
                        for i in reversed(clients_to_remove):
                            if i < len(frontend_clients[session_id]):
                                frontend_clients[session_id].pop(i)
                        
                        # Log successful send
                        print(f"[IPWebcam] ✓ Sent frame to {len(frontend_clients[session_id])} clients")
                    else:
                        print(f"[IPWebcam] ⚠ No clients for session {session_id}")
                                
                except Exception as e:
                    print(f"[IPWebcam] Critical error in WebSocket sending: {e}")
                    import traceback
                    traceback.print_exc()
            
            # Small delay to prevent excessive CPU usage
            time.sleep(0.03)  # ~30 FPS
            
    except Exception as e:
        print(f"[IPWebcam] Critical error in stream worker: {e}")
        logger.error(f"[IPWebcam] Critical error in stream worker: {e}")
        state["status"] = "error"
    finally:
        # Cleanup
        try:
            if 'cap' in locals():
                cap.release()
        except:
            pass
        print(f"[IPWebcam] Stream worker stopped for session {session_id}")


def start_ip_webcam_stream(session_id: int, webcam_url: str = "http://192.168.1.5:8080"):
    """Start streaming from an IP webcam in a background thread."""
    state = get_or_create_ip_session_state(session_id)
    
    # Stop existing stream if running
    if state["thread"] and state["thread"].is_alive():
        stop_ip_webcam_stream(session_id)
    
    # Create new stop event
    state["stop_event"] = threading.Event()
    
    # Wait a moment for frontend clients to connect
    print(f"[IPWebcam] Waiting 2 seconds for clients to connect...")
    time.sleep(2)
    
    # Start worker thread
    thread = threading.Thread(
        target=ip_webcam_stream_worker,
        args=(session_id, webcam_url),
        daemon=True
    )
    state["thread"] = thread
    thread.start()
    
    print(f"[IPWebcam] Started stream for session {session_id} from {webcam_url}")


def stop_ip_webcam_stream(session_id: int) -> bool:
    """Stop an IP webcam stream."""
    state = ip_webcam_sessions.get(session_id)
    if not state:
        return False
    
    # Signal thread to stop
    state["stop_event"].set()
    state["status"] = "stopped"
    
    # Wait for thread to finish
    if state["thread"] and state["thread"].is_alive():
        state["thread"].join(timeout=5)
    
    print(f"[IPWebcam] Stopped stream for session {session_id}")
    return True


def get_ip_webcam_status(session_id: int) -> dict | None:
    """Get the current status of an IP webcam session."""
    state = ip_webcam_sessions.get(session_id)
    if not state:
        return None
    return {
        "status": state["status"],
        "count": state["count"],
        "visible": state["visible"],
        "frames_processed": state["frames_processed"],
    }

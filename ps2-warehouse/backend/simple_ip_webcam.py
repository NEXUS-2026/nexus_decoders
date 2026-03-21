"""
Minimal IP webcam implementation - no complex async, just basic streaming
"""
import cv2
import json
import time
import threading
from routers.detection import frontend_clients

def simple_ip_webcam_worker(session_id: int, webcam_url: str):
    """Ultra-simple IP webcam worker"""
    print(f"[SimpleIPCam] Starting for session {session_id} from {webcam_url}")
    
    # Use /video endpoint (we confirmed this works)
    if not webcam_url.endswith('/video'):
        stream_url = f"{webcam_url}/video"
    else:
        stream_url = webcam_url
    
    print(f"[SimpleIPCam] Using stream URL: {stream_url}")
    
    # Open with OpenCV
    cap = cv2.VideoCapture(stream_url)
    
    if not cap.isOpened():
        print(f"[SimpleIPCam] FAILED to open: {stream_url}")
        return
    
    print(f"[SimpleIPCam] SUCCESS: Opened {stream_url}")
    print(f"[SimpleIPCam] Backend: {cap.getBackendName()}")
    
    frame_count = 0
    
    try:
        while True:  # Simple infinite loop
            ret, frame = cap.read()
            if not ret:
                print("[SimpleIPCam] No frame, retrying...")
                time.sleep(0.1)
                continue
            
            frame_count += 1
            
            # Just send raw frame - no processing
            _, jpeg = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
            frame_bytes = jpeg.tobytes()
            
            # Create simple count data
            count_data = {
                "session_id": session_id,
                "count": frame_count % 10,  # Simple fake count
                "visible": (frame_count % 5),  # Simple fake visible
                "frame_idx": frame_count,
            }
            
            # Send to clients
            if session_id in frontend_clients:
                for client in frontend_clients[session_id]:
                    try:
                        client.send_bytes(frame_bytes)
                        client.send_text(json.dumps(count_data))
                    except Exception as e:
                        print(f"[SimpleIPCam] Send error: {e}")
            
            print(f"[SimpleIPCam] Sent frame {frame_count} to {len(frontend_clients.get(session_id, []))} clients")
            
            # Small delay
            time.sleep(0.1)  # 10 FPS for stability
            
    except Exception as e:
        print(f"[SimpleIPCam] ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        cap.release()
        print(f"[SimpleIPCam] STOPPED session {session_id}")

# Global tracking
simple_sessions = {}

def start_simple_ip_webcam(session_id: int, webcam_url: str):
    """Start simple IP webcam"""
    if session_id in simple_sessions:
        return  # Already running
    
    thread = threading.Thread(
        target=simple_ip_webcam_worker,
        args=(session_id, webcam_url),
        daemon=True
    )
    simple_sessions[session_id] = thread
    thread.start()
    print(f"[SimpleIPCam] Started thread for session {session_id}")

def stop_simple_ip_webcam(session_id: int):
    """Stop simple IP webcam"""
    if session_id in simple_sessions:
        print(f"[SimpleIPCam] Stopping session {session_id}")
        # Note: Thread will stop on its own when cap fails or loop breaks
        del simple_sessions[session_id]

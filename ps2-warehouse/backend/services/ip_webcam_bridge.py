"""
Simple IP webcam bridge that uses existing live stream infrastructure
Instead of creating a separate thread, we'll create a mock engine WebSocket
that the existing detection router can handle.
"""
import asyncio
import json
import time
import cv2
import numpy as np
from urllib.parse import urlparse

# Simple mock engine that sends frames to the existing detection router
class IPWebcamEngine:
    def __init__(self, session_id: int, webcam_url: str):
        self.session_id = session_id
        self.webcam_url = webcam_url
        self.running = False
        self.stop_event = asyncio.Event()
        
    async def start_stream(self):
        """Starts IP webcam stream and sends to existing detection router"""
        self.running = True
        
        # Parse URL to get video endpoint
        parsed_url = urlparse(self.webcam_url)
        if not parsed_url.path.endswith('/video'):
            if parsed_url.path.endswith('/'):
                stream_url = f"{self.webcam_url}video"
            else:
                stream_url = f"{self.webcam_url}/video"
        else:
            stream_url = self.webcam_url
            
        print(f"[IPWebcamEngine] Starting stream from: {stream_url}")
        
        # Open video stream
        cap = cv2.VideoCapture(stream_url)
        
        if not cap.isOpened():
            print(f"[IPWebcamEngine] Failed to open stream: {stream_url}")
            return
            
        print(f"[IPWebcamEngine] Connected to webcam for session {self.session_id}")
        
        try:
            while not self.stop_event.is_set():
                ret, frame = cap.read()
                if not ret:
                    print("[IPWebcamEngine] Failed to read frame, retrying...")
                    await asyncio.sleep(0.1)
                    continue
                
                # Simple processing - just send the raw frame for now
                # You can add YOLO detection here later
                
                # Encode frame
                _, jpeg = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
                frame_bytes = jpeg.tobytes()
                
                # Create count data
                count_data = {
                    "session_id": self.session_id,
                    "count": 0,  # Simple count for now
                    "visible": 0,
                    "frame_idx": 0,
                }
                
                # Send to frontend clients using the same method as the regular engine
                from routers.detection import frontend_clients
                
                if self.session_id in frontend_clients and frontend_clients[self.session_id]:
                    # Send to all connected clients
                    dead_clients = []
                    for client in frontend_clients[self.session_id]:
                        try:
                            # Send frame bytes
                            await client.send_bytes(frame_bytes)
                            # Send count data  
                            await client.send_text(json.dumps(count_data))
                        except Exception as e:
                            print(f"[IPWebcamEngine] Error sending to client: {e}")
                            dead_clients.append(client)
                    
                    # Remove dead clients
                    for client in dead_clients:
                        if client in frontend_clients[self.session_id]:
                            frontend_clients[self.session_id].remove(client)
                    
                    print(f"[IPWebcamEngine] Sent frame to {len(frontend_clients[self.session_id])} clients")
                else:
                    print(f"[IPWebcamEngine] No clients for session {self.session_id}")
                
                # Small delay
                await asyncio.sleep(0.033)  # ~30 FPS
                
        except Exception as e:
            print(f"[IPWebcamEngine] Error in stream: {e}")
        finally:
            cap.release()
            print(f"[IPWebcamEngine] Stream stopped for session {self.session_id}")
    
    async def stop(self):
        """Stop the stream"""
        self.stop_event.set()
        self.running = False

# Global instance tracker
active_engines = {}

def start_ip_webcam_bridge(session_id: int, webcam_url: str):
    """Start IP webcam using the existing infrastructure"""
    try:
        if session_id in active_engines:
            stop_ip_webcam_bridge(session_id)
        
        engine = IPWebcamEngine(session_id, webcam_url)
        active_engines[session_id] = engine
        
        # Start in background task
        loop = asyncio.get_event_loop()
        if loop and loop.is_running():
            task = loop.create_task(engine.start_stream())
            print(f"[IPWebcamBridge] Started bridge for session {session_id}")
        else:
            print(f"[IPWebcamBridge] No event loop running for session {session_id}")
            
    except Exception as e:
        print(f"[IPWebcamBridge] Error starting bridge: {e}")
        import traceback
        traceback.print_exc()

def stop_ip_webcam_bridge(session_id: int):
    """Stop IP webcam bridge"""
    if session_id in active_engines:
        engine = active_engines[session_id]
        asyncio.create_task(engine.stop())
        del active_engines[session_id]
        print(f"[IPWebcamEngine] Stopped bridge for session {session_id}")

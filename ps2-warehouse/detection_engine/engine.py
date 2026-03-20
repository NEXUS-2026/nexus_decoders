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


async def run(video_source: str, session_id: int, conf: float = 0.45,
              model_path: str = "yolov8n.pt", backend_url: str = BACKEND_WS):
    print(f"[Engine] Connecting to backend at {backend_url}")
    async with websockets.connect(backend_url) as ws:
        print("[Engine] Connected.")
        model = YOLO(model_path)
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
    parser = argparse.ArgumentParser(description="PS2 Box Detection Engine")
    parser.add_argument("--source", type=str, required=True, help="Video path or camera index (0)")
    parser.add_argument("--session", type=int, required=True, help="Session ID from backend")
    parser.add_argument("--conf", type=float, default=0.45, help="YOLO confidence threshold")
    parser.add_argument("--model", type=str, default="yolov8n.pt", help="Path to YOLO model weights")
    parser.add_argument("--backend", type=str, default=BACKEND_WS, help="Backend WebSocket URL")
    args = parser.parse_args()

    asyncio.run(run(args.source, args.session, args.conf, args.model, args.backend))

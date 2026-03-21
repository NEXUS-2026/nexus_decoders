#!/usr/bin/env python3
"""
Raspberry Pi Relay Script for PS2 Warehouse Vision Engine.

This lightweight script runs on the Raspberry Pi 3B+.
It captures frames from the IP Webcam app on the phone and
relays them to the backend server via WebSocket.

Flow: Phone (IP Webcam) -> THIS SCRIPT (Raspi) -> Backend -> Frontend

Usage:
    python rpi_relay.py --source http://192.168.1.5:8080/video \\
                        --session 1 \\
                        --backend ws://BACKEND_IP:8000/ws/stream-ingest/1

Dependencies (install on Raspi):
    pip install opencv-python-headless websockets
"""

import asyncio
import argparse
import cv2
import time
import sys


async def relay(
    source_url: str,
    session_id: int,
    backend_ws_url: str,
    quality: int = 70,
    max_fps: int = 15,
):
    """
    Capture frames from IP Webcam and relay to backend via WebSocket.
    """
    try:
        import websockets
    except ImportError:
        print("[Relay] ERROR: 'websockets' not installed. Run: pip install websockets")
        sys.exit(1)

    print(f"[Relay] ========================================")
    print(f"[Relay] PS2 Warehouse - Raspi Frame Relay")
    print(f"[Relay] ========================================")
    print(f"[Relay] Source:  {source_url}")
    print(f"[Relay] Session: {session_id}")
    print(f"[Relay] Backend: {backend_ws_url}")
    print(f"[Relay] Quality: {quality}%  |  Max FPS: {max_fps}")
    print(f"[Relay] ========================================")

    # Open the IP Webcam video stream
    print(f"[Relay] Connecting to IP Webcam at {source_url}...")
    cap = cv2.VideoCapture(source_url)

    if not cap.isOpened():
        print(f"[Relay] ERROR: Cannot open video source: {source_url}")
        print(f"[Relay] Make sure IP Webcam is running on your phone and the URL is correct.")
        print(f"[Relay] Typical URL format: http://<phone-ip>:8080/video")
        sys.exit(1)

    print(f"[Relay] Connected to IP Webcam!")

    frame_interval = 1.0 / max_fps
    reconnect_delay = 2  # seconds
    max_reconnect_attempts = 50

    while True:
        try:
            print(f"[Relay] Connecting to backend at {backend_ws_url}...")
            async with websockets.connect(
                backend_ws_url,
                max_size=10 * 1024 * 1024,  # 10MB max message
                ping_interval=20,
                ping_timeout=10,
            ) as ws:
                print(f"[Relay] Connected to backend! Streaming frames...")

                frame_count = 0
                start_time = time.time()
                reconnect_attempts = 0
                cam_reconnect_attempts = 0

                while True:
                    loop_start = time.time()

                    ret, frame = cap.read()
                    if not ret:
                        cam_reconnect_attempts += 1
                        if cam_reconnect_attempts > 10:
                            print(f"[Relay] Lost IP Webcam connection. Reconnecting...")
                            cap.release()
                            await asyncio.sleep(1)
                            cap = cv2.VideoCapture(source_url)
                            cam_reconnect_attempts = 0
                            if not cap.isOpened():
                                print(f"[Relay] Failed to reconnect to IP Webcam.")
                                await asyncio.sleep(3)
                                cap = cv2.VideoCapture(source_url)
                        continue

                    cam_reconnect_attempts = 0

                    # Resize frame to reduce bandwidth (optional, adjust as needed)
                    h, w = frame.shape[:2]
                    if w > 640:
                        scale = 640 / w
                        frame = cv2.resize(frame, (640, int(h * scale)))

                    # Encode to JPEG
                    _, jpeg = cv2.imencode(
                        ".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, quality]
                    )
                    frame_bytes = jpeg.tobytes()

                    # Send raw frame to backend via WebSocket
                    await ws.send(frame_bytes)

                    frame_count += 1

                    # Print stats every 5 seconds
                    elapsed = time.time() - start_time
                    if elapsed >= 5.0:
                        actual_fps = frame_count / elapsed
                        kb_per_frame = len(frame_bytes) / 1024
                        print(
                            f"[Relay] FPS: {actual_fps:.1f} | "
                            f"Frame size: {kb_per_frame:.1f}KB | "
                            f"Frames sent: {frame_count}"
                        )
                        frame_count = 0
                        start_time = time.time()

                    # Rate limit to target FPS
                    elapsed_frame = time.time() - loop_start
                    sleep_time = frame_interval - elapsed_frame
                    if sleep_time > 0:
                        await asyncio.sleep(sleep_time)

        except Exception as e:
            reconnect_attempts += 1
            print(f"[Relay] Connection lost: {e}")

            if reconnect_attempts > max_reconnect_attempts:
                print(f"[Relay] Max reconnect attempts reached. Exiting.")
                break

            print(f"[Relay] Reconnecting in {reconnect_delay}s... (attempt {reconnect_attempts}/{max_reconnect_attempts})")
            await asyncio.sleep(reconnect_delay)

    cap.release()
    print(f"[Relay] Shutdown complete.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Raspi Relay: Capture IP Webcam stream and push to backend",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python rpi_relay.py --source http://192.168.1.5:8080/video --session 1 --backend ws://192.168.1.200:8000/ws/stream-ingest/1
  python rpi_relay.py --source http://192.168.1.5:8080/video --session 5 --backend ws://192.168.1.200:8000/ws/stream-ingest/5 --fps 10 --quality 60
        """,
    )
    parser.add_argument(
        "--source", type=str, required=True,
        help="IP Webcam video stream URL (e.g., http://192.168.1.5:8080/video)",
    )
    parser.add_argument(
        "--session", type=int, required=True,
        help="Session ID from the backend (shown on the frontend after creating a session)",
    )
    parser.add_argument(
        "--backend", type=str, required=True,
        help="Backend WebSocket URL (e.g., ws://192.168.1.200:8000/ws/stream-ingest/SESSION_ID)",
    )
    parser.add_argument(
        "--quality", type=int, default=70,
        help="JPEG compression quality (1-100, default: 70)",
    )
    parser.add_argument(
        "--fps", type=int, default=15,
        help="Maximum frames per second to send (default: 15)",
    )

    args = parser.parse_args()

    # Auto-build the backend URL with session ID if not already included
    backend_url = args.backend
    if not backend_url.endswith(f"/{args.session}"):
        backend_url = f"{backend_url.rstrip('/')}"

    asyncio.run(relay(
        source_url=args.source,
        session_id=args.session,
        backend_ws_url=backend_url,
        quality=args.quality,
        max_fps=args.fps,
    ))

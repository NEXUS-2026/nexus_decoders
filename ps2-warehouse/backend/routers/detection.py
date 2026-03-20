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

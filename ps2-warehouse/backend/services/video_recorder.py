import cv2
from pathlib import Path
from datetime import datetime

STORAGE_DIR = Path(__file__).parent.parent.parent / "storage" / "videos"
STORAGE_DIR.mkdir(parents=True, exist_ok=True)

# Global dict: session_id (int) -> cv2.VideoWriter instance
active_recorders: dict[int, cv2.VideoWriter] = {}


def start_recording(session_id: int, width: int = 640, height: int = 480, fps: float = 15.0) -> str:
    """
    Start an H.264 video recording for a session.
    Returns the file path as a string.
    """
    output_path = str(STORAGE_DIR / f"{session_id}.mp4")
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    active_recorders[session_id] = writer
    return output_path


def stop_recording(session_id: int) -> str | None:
    """
    Finalize and release the VideoWriter for a session.
    Returns the saved file path, or None if not found.
    """
    writer = active_recorders.pop(session_id, None)
    if writer:
        writer.release()
        return str(STORAGE_DIR / f"{session_id}.mp4")
    return None

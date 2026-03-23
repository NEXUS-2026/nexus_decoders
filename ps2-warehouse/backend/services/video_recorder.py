import cv2
from pathlib import Path
from datetime import datetime
import shutil
import subprocess
import tempfile
from typing import Optional

STORAGE_DIR = Path(__file__).parent.parent.parent / "storage" / "videos"
STORAGE_DIR.mkdir(parents=True, exist_ok=True)

class _Recorder:
    def __init__(self, output_path: Path, fps: float = 15.0):
        self.output_path = output_path
        self.fps = fps
        self._writer: Optional[cv2.VideoWriter] = None

    def write(self, frame):
        if frame is None:
            return
        if self._writer is None:
            height, width = frame.shape[:2]
            fourcc = cv2.VideoWriter_fourcc(*"mp4v")
            self._writer = cv2.VideoWriter(str(self.output_path), fourcc, self.fps, (width, height))
        self._writer.write(frame)

    def release(self):
        if self._writer is not None:
            self._writer.release()
            self._writer = None


# Global dict: session_id (int) -> recorder instance
active_recorders: dict[int, _Recorder] = {}


def start_recording(session_id: int, width: int = 640, height: int = 480, fps: float = 15.0) -> str:
    """
    Start an H.264 video recording for a session.
    Returns the file path as a string.
    """
    output_path = STORAGE_DIR / f"{session_id}.mp4"
    active_recorders[session_id] = _Recorder(output_path=output_path, fps=fps)
    return str(output_path)


def stop_recording(session_id: int) -> str | None:
    """
    Finalize and release the VideoWriter for a session.
    Returns the saved file path, or None if not found.
    """
    recorder = active_recorders.pop(session_id, None)
    if recorder:
        recorder.release()
        output_path = STORAGE_DIR / f"{session_id}.mp4"

        ffmpeg_path = shutil.which("ffmpeg")
        if ffmpeg_path and output_path.exists() and output_path.stat().st_size > 0:
            tmp_dir = Path(tempfile.mkdtemp(prefix=f"ps2_video_{session_id}_"))
            tmp_out = tmp_dir / f"{session_id}.mp4"
            try:
                cmd = [
                    ffmpeg_path,
                    "-y",
                    "-i",
                    str(output_path),
                    "-c:v",
                    "libx264",
                    "-preset",
                    "veryfast",
                    "-crf",
                    "28",
                    "-pix_fmt",
                    "yuv420p",
                    "-movflags",
                    "+faststart",
                    "-c:a",
                    "aac",
                    "-b:a",
                    "96k",
                    str(tmp_out),
                ]
                subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                if tmp_out.exists() and tmp_out.stat().st_size > 0:
                    tmp_out.replace(output_path)
            except Exception:
                pass
            finally:
                try:
                    shutil.rmtree(tmp_dir, ignore_errors=True)
                except Exception:
                    pass

        return str(output_path)
    return None

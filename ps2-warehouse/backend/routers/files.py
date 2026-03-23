from fastapi import APIRouter, HTTPException
from fastapi import Request
from fastapi.responses import FileResponse, StreamingResponse
from pathlib import Path
from typing import Iterator

router = APIRouter()

VIDEOS_DIR = Path(__file__).parent.parent.parent / "storage" / "videos"
CHALLANS_DIR = Path(__file__).parent.parent.parent / "storage" / "challans"


@router.get("/challan/{session_id}")
def download_challan(session_id: int):
    path = CHALLANS_DIR / f"{session_id}.pdf"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Challan not found")
    return FileResponse(
        path=str(path),
        media_type="application/pdf",
        filename=f"challan_session_{session_id}.pdf"
    )


@router.get("/video/{session_id}")
def stream_video(session_id: int, request: Request):
    path = VIDEOS_DIR / f"{session_id}.mp4"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Video not found")

    file_size = path.stat().st_size
    range_header = request.headers.get("range")

    if not range_header:
        return FileResponse(
            path=str(path),
            media_type="video/mp4",
            filename=f"session_{session_id}.mp4",
            headers={"Accept-Ranges": "bytes"},
        )

    if not range_header.startswith("bytes="):
        raise HTTPException(status_code=416, detail="Invalid Range header")

    range_value = range_header.replace("bytes=", "", 1)
    start_str, end_str = (range_value.split("-", 1) + [""])[:2]

    try:
        start = int(start_str) if start_str else 0
        end = int(end_str) if end_str else (file_size - 1)
    except ValueError:
        raise HTTPException(status_code=416, detail="Invalid Range values")

    if start >= file_size:
        raise HTTPException(status_code=416, detail="Range start out of bounds")

    end = min(end, file_size - 1)
    if end < start:
        raise HTTPException(status_code=416, detail="Invalid Range")

    chunk_size = 1024 * 1024
    content_length = (end - start) + 1

    def iter_file() -> Iterator[bytes]:
        with open(path, "rb") as f:
            f.seek(start)
            remaining = content_length
            while remaining > 0:
                data = f.read(min(chunk_size, remaining))
                if not data:
                    break
                remaining -= len(data)
                yield data

    headers = {
        "Accept-Ranges": "bytes",
        "Content-Range": f"bytes {start}-{end}/{file_size}",
        "Content-Length": str(content_length),
    }

    return StreamingResponse(
        iter_file(),
        status_code=206,
        media_type="video/mp4",
        headers=headers,
    )

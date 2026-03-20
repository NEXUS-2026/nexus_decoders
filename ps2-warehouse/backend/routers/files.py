from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pathlib import Path

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
def stream_video(session_id: int):
    path = VIDEOS_DIR / f"{session_id}.mp4"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Video not found")
    return FileResponse(
        path=str(path),
        media_type="video/mp4",
        filename=f"session_{session_id}.mp4",
        headers={"Accept-Ranges": "bytes"}  # Required for seek support in browser
    )

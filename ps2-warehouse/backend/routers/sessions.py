from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlmodel import Session as DBSession, select
from database import engine, get_session
from models import Session, DetectionLog
from services.video_recorder import start_recording, stop_recording
from services.challan_gen import generate_challan
from services.detection_runner import run_detection_on_video, detection_tasks
from routers.settings import load_settings
from datetime import datetime
from pydantic import BaseModel
from pathlib import Path
import shutil

router = APIRouter()

UPLOADS_DIR = Path(__file__).parent.parent.parent / "storage" / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


class StartSessionRequest(BaseModel):
    operator_id: str
    batch_id: str
    input_mode: str = "upload"  # "upload" | "live"


@router.post("/start")
def start_session(body: StartSessionRequest, db: DBSession = Depends(get_session)):
    session = Session(
        operator_id=body.operator_id,
        batch_id=body.batch_id,
        input_mode=body.input_mode,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Start video recording (for saving processed output)
    video_path = start_recording(session.id)
    session.video_path = video_path
    db.add(session)
    db.commit()
    db.refresh(session)

    return {
        "session_id": session.id,
        "operator_id": session.operator_id,
        "batch_id": session.batch_id,
        "started_at": session.started_at.isoformat(),
        "input_mode": session.input_mode,
    }


@router.post("/upload-video/{session_id}")
async def upload_video(
    session_id: int,
    file: UploadFile = File(...),
    db: DBSession = Depends(get_session),
):
    """Upload a video file for server-side detection processing."""
    session = db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.input_mode != "upload":
        raise HTTPException(status_code=400, detail="Session is not in upload mode")

    # Save uploaded file
    file_ext = Path(file.filename).suffix if file.filename else ".mp4"
    upload_path = UPLOADS_DIR / f"{session_id}{file_ext}"

    with open(upload_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    session.uploaded_video_path = str(upload_path)
    session.status = "processing"
    db.add(session)
    db.commit()

    # Start background detection
    current_settings = load_settings()
    run_detection_on_video(
        session_id=session_id,
        video_path=str(upload_path),
        conf=current_settings.get("confidence_threshold", 0.45),
    )

    return {
        "session_id": session_id,
        "status": "processing",
        "message": "Video uploaded. Detection started.",
    }


@router.get("/detection-status/{session_id}")
def get_detection_status(session_id: int):
    """Get the status of a running detection task."""
    task = detection_tasks.get(session_id)
    if not task:
        return {"session_id": session_id, "status": "unknown"}
    return {"session_id": session_id, **task}


@router.post("/stop/{session_id}")
def stop_session(session_id: int, db: DBSession = Depends(get_session)):
    session = db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # If already completed (by detection runner), just return results
    if session.status == "completed":
        return {
            "session_id": session.id,
            "final_box_count": session.final_box_count,
            "challan_url": f"/api/files/challan/{session_id}",
            "video_url": f"/api/files/video/{session_id}",
        }

    # Stop and save video
    video_path = stop_recording(session_id)
    session.video_path = video_path
    session.stopped_at = datetime.utcnow()
    session.status = "completed"

    # Get final box count from last detection log
    last_log = db.exec(
        select(DetectionLog)
        .where(DetectionLog.session_id == session_id)
        .order_by(DetectionLog.id.desc())
    ).first()
    session.final_box_count = last_log.box_count if last_log else 0

    db.add(session)
    db.commit()
    db.refresh(session)

    # Generate challan PDF
    challan_path = generate_challan(session)
    session.challan_path = challan_path
    db.add(session)
    db.commit()

    return {
        "session_id": session.id,
        "final_box_count": session.final_box_count,
        "challan_url": f"/api/files/challan/{session_id}",
        "video_url": f"/api/files/video/{session_id}",
    }


@router.get("/")
def list_sessions(db: DBSession = Depends(get_session)):
    return db.exec(select(Session).order_by(Session.id.desc())).all()


@router.get("/{session_id}")
def get_session_detail(session_id: int, db: DBSession = Depends(get_session)):
    session = db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Not found")
    return session

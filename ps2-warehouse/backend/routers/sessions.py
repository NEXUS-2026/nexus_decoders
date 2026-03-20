from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session as DBSession, select
from database import engine, get_session
from models import Session, DetectionLog
from services.video_recorder import start_recording, stop_recording
from services.challan_gen import generate_challan
from datetime import datetime

router = APIRouter()


@router.post("/start")
def start_session(body: dict, db: DBSession = Depends(get_session)):
    session = Session(
        operator_id=body["operator_id"],
        batch_id=body["batch_id"],
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Start video recording
    video_path = start_recording(session.id)
    session.video_path = video_path
    db.add(session)
    db.commit()

    return {
        "session_id": session.id,
        "operator_id": session.operator_id,
        "batch_id": session.batch_id,
        "started_at": session.started_at,
    }


@router.post("/stop/{session_id}")
def stop_session(session_id: int, db: DBSession = Depends(get_session)):
    session = db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Stop and save video
    video_path = stop_recording(session_id)
    session.video_path = video_path
    session.stopped_at = datetime.utcnow()
    session.status = "completed"

    # Get final box count from last detection log
    logs = db.exec(
        select(DetectionLog)
        .where(DetectionLog.session_id == session_id)
        .order_by(DetectionLog.id.desc())
    ).first()
    session.final_box_count = logs.box_count if logs else 0

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

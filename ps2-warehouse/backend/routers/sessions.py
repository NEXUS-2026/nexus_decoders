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
from typing import List
from pathlib import Path
import shutil
import json
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

UPLOADS_DIR = Path(__file__).parent.parent.parent / "storage" / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


class ProductItem(BaseModel):
    name: str
    qty: int


class StartSessionRequest(BaseModel):
    operator_id: str
    batch_id: str
    input_mode: str = "upload"  # "upload" | "live" | "ip_webcam"
    customer_ms: str = ""
    transporter_id: str = ""
    courier_partner: str = ""
    challan_no: str = ""
    pickup_date: str = ""
    products: List[ProductItem] = []
    ip_webcam_url: str = ""
    challan_email: str = ""


@router.post("/start")
def start_session(body: StartSessionRequest, db: DBSession = Depends(get_session)):
    session = Session(
        operator_id=body.operator_id,
        batch_id=body.batch_id,
        input_mode=body.input_mode,
        customer_ms=body.customer_ms,
        transporter_id=body.transporter_id,
        courier_partner=body.courier_partner,
        challan_no=body.challan_no,
        pickup_date=body.pickup_date,
        products_json=json.dumps([p.dict() for p in body.products]),
        challan_email=body.challan_email,
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

    # Start IP webcam stream if selected
    if body.input_mode == "ip_webcam" and body.ip_webcam_url:
        from simple_ip_webcam import start_simple_ip_webcam
        start_simple_ip_webcam(session.id, body.ip_webcam_url)

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


class SessionAction(BaseModel):
    action: str

@router.post("/action/{session_id}")
def session_action(session_id: int, body: SessionAction):
    from services.detection_runner import detection_tasks
    from services.live_stream_runner import live_stream_sessions
    from services.ip_webcam_bridge import active_engines
    internal_action = "run" if body.action == "resume" else body.action
    
    if session_id in detection_tasks:
        detection_tasks[session_id]["action"] = internal_action
    elif session_id in live_stream_sessions:
        live_stream_sessions[session_id]["action"] = internal_action
    elif session_id in active_engines:
        # For IP webcam bridge, we handle actions differently
        engine = active_engines[session_id]
        if body.action == "stop":
            asyncio.create_task(engine.stop())
        # Note: pause/resume would need more implementation
    return {"status": "ok", "action": body.action}

@router.post("/stop/{session_id}")
def stop_session(session_id: int, db: DBSession = Depends(get_session)):
    session = db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Stop IP webcam stream if running
    if session.input_mode == "ip_webcam":
        from simple_ip_webcam import stop_simple_ip_webcam
        stop_simple_ip_webcam(session_id)

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

    # Send email if email address is provided
    if session.challan_email:
        try:
            from services.email_service import email_service
            from services.video_compressor import video_compressor
            
            # Compress video for email attachment
            compressed_video_path = None
            if video_path and os.path.exists(video_path):
                logger.info(f"Compressing video for email: {video_path}")
                compressed_video_path = video_compressor.compress_for_email(
                    video_path, 
                    max_size_mb=20  # Leave some margin under Gmail's 25MB limit
                )
                if compressed_video_path:
                    logger.info(f"Video compressed successfully: {compressed_video_path}")
                else:
                    logger.warning("Video compression failed, sending original video")
            
            # Create email content
            subject = f"Challan #{session.challan_no or session.id} - DECODERS System"
            
            # HTML email body
            html_body = f"""
            <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
                <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #333; margin: 0;">DECODERS</h1>
                        <p style="color: #666; margin: 5px 0;">Warehouse Vision Engine</p>
                    </div>
                    
                    <h2 style="color: #333; border-bottom: 2px solid #22c55e; padding-bottom: 10px;">Challan Details</h2>
                    
                    <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px; font-weight: bold; background-color: #f8f9fa; border: 1px solid #ddd;">Challan Number:</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">{session.challan_no or session.id}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; font-weight: bold; background-color: #f8f9fa; border: 1px solid #ddd;">Batch ID:</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">{session.batch_id}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; font-weight: bold; background-color: #f8f9fa; border: 1px solid #ddd;">Operator:</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">{session.operator_id}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; font-weight: bold; background-color: #f8f9fa; border: 1px solid #ddd;">Customer:</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">{session.customer_ms or 'N/A'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; font-weight: bold; background-color: #f8f9fa; border: 1px solid #ddd;">Transporter:</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">{session.transporter_id or 'N/A'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; font-weight: bold; background-color: #f8f9fa; border: 1px solid #ddd;">Pickup Date:</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">{session.pickup_date or 'N/A'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; font-weight: bold; background-color: #f8f9fa; border: 1px solid #ddd;">Final Box Count:</td>
                            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; color: #22c55e;">{session.final_box_count}</td>
                        </tr>
                    </table>
                    
                    <div style="margin-top: 20px; padding: 15px; background-color: #e8f5e8; border-radius: 5px; border-left: 4px solid #22c55e;">
                        <p style="margin: 0; font-size: 14px; color: #2d5016;">
                            <strong>📎 Attachments:</strong><br>
                            • Challan PDF document<br>
                            • Processed video {("(compressed for email)" if compressed_video_path else "")}
                        </p>
                    </div>
                    
                    <div style="margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
                        <p style="margin: 0; font-size: 12px; color: #666;">
                            This email was sent automatically by the DECODERS Warehouse Vision Engine.<br>
                            Session ID: {session.id} | Completed: {session.stopped_at.strftime('%Y-%m-%d %H:%M:%S') if session.stopped_at else 'N/A'}
                        </p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            # Send email with attachments
            email_sent = email_service.send_challan_email(
                recipient_email=session.challan_email,
                subject=subject,
                body=html_body,
                pdf_attachment_path=challan_path,
                video_attachment_path=compressed_video_path or video_path
            )
            
            if email_sent:
                print(f"Email sent successfully to {session.challan_email}")
                # Clean up compressed video if it was created
                if compressed_video_path and os.path.exists(compressed_video_path):
                    os.remove(compressed_video_path)
                    logger.info(f"Cleaned up temporary compressed video: {compressed_video_path}")
            else:
                print(f"Failed to send email to {session.challan_email}")
                
        except Exception as e:
            print(f"Error sending email: {str(e)}")

    return {
        "session_id": session.id,
        "final_box_count": session.final_box_count,
        "challan_url": f"/api/files/challan/{session_id}",
        "video_url": f"/api/files/video/{session_id}",
    }


@router.get("/")
def list_sessions(db: DBSession = Depends(get_session)):
    """Get all sessions with pagination support"""
    return db.exec(select(Session).order_by(Session.id.desc())).all()

@router.get("/{session_id}")
def get_session_detail(session_id: int, db: DBSession = Depends(get_session)):
    session = db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Not found")
    return session

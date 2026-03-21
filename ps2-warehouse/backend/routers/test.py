"""
Database test endpoint for debugging
"""
from fastapi import APIRouter, Depends
from sqlmodel import Session as DBSession, select, func
from database import get_session
from models import Session
from pathlib import Path

router = APIRouter()

@router.get("/test-db")
def test_database(db: DBSession = Depends(get_session)):
    """Test database connectivity and data"""
    try:
        # Check database file exists
        db_path = Path(__file__).parent.parent.parent / "storage" / "ps2.db"
        db_exists = db_path.exists()
        
        # Get all sessions (simple query)
        sessions = db.exec(select(Session)).all()
        session_count = len(sessions)
        
        # Get recent sessions
        recent_sessions = db.exec(
            select(Session).order_by(Session.id.desc()).limit(5)
        ).all()
        
        return {
            "database_file_exists": db_exists,
            "database_path": str(db_path),
            "total_sessions": session_count,
            "recent_sessions": [
                {
                    "id": s.id,
                    "operator_id": s.operator_id,
                    "batch_id": s.batch_id,
                    "status": s.status,
                    "started_at": s.started_at.isoformat() if s.started_at else None,
                    "final_box_count": s.final_box_count
                }
                for s in recent_sessions
            ]
        }
    except Exception as e:
        return {
            "error": str(e),
            "database_file_exists": db_path.exists(),
            "database_path": str(db_path)
        }

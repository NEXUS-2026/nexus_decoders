"""
Analytics API endpoints for dashboard statistics and metrics
"""
from fastapi import APIRouter, Depends
from sqlmodel import Session as DBSession
from database import get_session
from services.analytics_service import analytics_service
from typing import Dict, Any

router = APIRouter()

@router.get("/dashboard")
def get_dashboard_stats(db: DBSession = Depends(get_session)) -> Dict[str, Any]:
    """Get comprehensive dashboard statistics"""
    return analytics_service.get_dashboard_stats(db)

@router.get("/detection-trends")
def get_detection_trends(days: int = 30, db: DBSession = Depends(get_session)) -> Dict[str, Any]:
    """Get detection trends over time"""
    return analytics_service.get_detection_trends(db, days)

@router.get("/input-mode-performance")
def get_input_mode_performance(db: DBSession = Depends(get_session)) -> Dict[str, Any]:
    """Get performance metrics by input mode"""
    return analytics_service.get_input_mode_performance(db)

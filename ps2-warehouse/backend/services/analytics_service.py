"""
Analytics service for generating session statistics and metrics
"""
import sqlmodel
from sqlmodel import Session as DBSession, select, func
from models import Session, DetectionLog
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import json

class AnalyticsService:
    def __init__(self):
        pass
    
    def get_dashboard_stats(self, db: DBSession) -> Dict[str, Any]:
        """Get overall dashboard statistics"""
        try:
            # Total sessions
            all_sessions = db.exec(select(Session)).all()
            total_sessions = len(all_sessions)
            
            # Active sessions
            active_sessions = len([s for s in all_sessions if s.status == "active"])
            
            # Completed sessions
            completed_sessions = len([s for s in all_sessions if s.status == "completed"])
            
            # Total boxes detected
            total_boxes = sum(s.final_box_count for s in all_sessions if s.status == "completed")
            
            # Average processing time (in minutes)
            avg_processing_time = self._get_average_processing_time(db)
            
            # Sessions by input mode
            sessions_by_mode = self._get_sessions_by_input_mode(db)
            
            # Recent activity (last 7 days)
            recent_activity = self._get_recent_activity(db, days=7)
            
            # Operator performance
            operator_stats = self._get_operator_stats(db)
            
            return {
                "total_sessions": total_sessions,
                "active_sessions": active_sessions,
                "completed_sessions": completed_sessions,
                "total_boxes_detected": total_boxes,
                "average_processing_time_minutes": avg_processing_time,
                "sessions_by_input_mode": sessions_by_mode,
                "recent_activity": recent_activity,
                "operator_performance": operator_stats,
                "last_updated": datetime.utcnow().isoformat()
            }
        except Exception as e:
            print(f"Error getting dashboard stats: {str(e)}")
            return {}
    
    def _get_average_processing_time(self, db: DBSession) -> float:
        """Calculate average processing time in minutes"""
        try:
            sessions = db.exec(
                select(Session).where(
                    Session.status == "completed",
                    Session.started_at.isnot(None),
                    Session.stopped_at.isnot(None)
                )
            ).all()
            
            if not sessions:
                return 0.0
            
            total_time = 0
            for session in sessions:
                if session.started_at and session.stopped_at:
                    duration = session.stopped_at - session.started_at
                    total_time += duration.total_seconds()
            
            avg_seconds = total_time / len(sessions)
            return round(avg_seconds / 60, 2)  # Convert to minutes
        except Exception:
            return 0.0
    
    def _get_sessions_by_input_mode(self, db: DBSession) -> Dict[str, int]:
        """Get session count by input mode"""
        try:
            result = db.exec(
                select(Session.input_mode, func.count(Session.id))
                .group_by(Session.input_mode)
            ).all()
            
            return {mode: count for mode, count in result}
        except Exception:
            return {"upload": 0, "live": 0, "ip_webcam": 0}
    
    def _get_recent_activity(self, db: DBSession, days: int = 7) -> List[Dict[str, Any]]:
        """Get session activity for the last N days"""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            sessions = db.exec(
                select(Session).where(Session.started_at >= cutoff_date)
                .order_by(Session.started_at.desc())
            ).all()
            
            activity = []
            for session in sessions:
                activity.append({
                    "session_id": session.id,
                    "operator_id": session.operator_id,
                    "batch_id": session.batch_id,
                    "input_mode": session.input_mode,
                    "status": session.status,
                    "final_box_count": session.final_box_count,
                    "started_at": session.started_at.isoformat() if session.started_at else None,
                    "stopped_at": session.stopped_at.isoformat() if session.stopped_at else None,
                    "processing_time_minutes": self._get_session_duration_minutes(session)
                })
            
            return activity
        except Exception:
            return []
    
    def _get_session_duration_minutes(self, session: Session) -> Optional[float]:
        """Get session duration in minutes"""
        if session.started_at and session.stopped_at:
            duration = session.stopped_at - session.started_at
            return round(duration.total_seconds() / 60, 2)
        return None
    
    def _get_operator_stats(self, db: DBSession) -> List[Dict[str, Any]]:
        """Get performance statistics by operator"""
        try:
            # Get all completed sessions grouped by operator
            result = db.exec(
                select(
                    Session.operator_id,
                    func.count(Session.id).label('session_count'),
                    func.sum(Session.final_box_count).label('total_boxes'),
                    func.avg(Session.final_box_count).label('avg_boxes_per_session')
                )
                .where(Session.status == "completed")
                .group_by(Session.operator_id)
                .order_by(func.count(Session.id).desc())
            ).all()
            
            operator_stats = []
            for operator_id, session_count, total_boxes, avg_boxes in result:
                # Get average processing time for this operator
                avg_time = self._get_operator_avg_processing_time(db, operator_id)
                
                operator_stats.append({
                    "operator_id": operator_id,
                    "total_sessions": session_count,
                    "total_boxes_detected": total_boxes or 0,
                    "average_boxes_per_session": round(avg_boxes or 0, 2),
                    "average_processing_time_minutes": avg_time
                })
            
            return operator_stats
        except Exception:
            return []
    
    def _get_operator_avg_processing_time(self, db: DBSession, operator_id: str) -> float:
        """Get average processing time for a specific operator"""
        try:
            sessions = db.exec(
                select(Session).where(
                    Session.operator_id == operator_id,
                    Session.status == "completed",
                    Session.started_at.isnot(None),
                    Session.stopped_at.isnot(None)
                )
            ).all()
            
            if not sessions:
                return 0.0
            
            total_time = 0
            for session in sessions:
                if session.started_at and session.stopped_at:
                    duration = session.stopped_at - session.started_at
                    total_time += duration.total_seconds()
            
            avg_seconds = total_time / len(sessions)
            return round(avg_seconds / 60, 2)
        except Exception:
            return 0.0
    
    def get_detection_trends(self, db: DBSession, days: int = 30) -> Dict[str, Any]:
        """Get detection trends over time"""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            # Daily session counts and box counts
            daily_stats = db.exec(
                select(
                    func.date(Session.started_at).label('date'),
                    func.count(Session.id).label('sessions'),
                    func.sum(Session.final_box_count).label('boxes')
                )
                .where(Session.started_at >= cutoff_date)
                .group_by(func.date(Session.started_at))
                .order_by(func.date(Session.started_at))
            ).all()
            
            trends = {
                "period_days": days,
                "daily_stats": [
                    {
                        "date": str(date),
                        "sessions": sessions,
                        "boxes": boxes or 0
                    }
                    for date, sessions, boxes in daily_stats
                ],
                "total_sessions": sum(sessions for _, sessions, _ in daily_stats),
                "total_boxes": sum(boxes or 0 for _, _, boxes in daily_stats)
            }
            
            return trends
        except Exception as e:
            print(f"Error getting detection trends: {str(e)}")
            return {"period_days": days, "daily_stats": [], "total_sessions": 0, "total_boxes": 0}
    
    def get_input_mode_performance(self, db: DBSession) -> Dict[str, Any]:
        """Get performance metrics by input mode"""
        try:
            result = db.exec(
                select(
                    Session.input_mode,
                    func.count(Session.id).label('total_sessions'),
                    func.count(func.case((Session.status == "completed", 1))).label('completed_sessions'),
                    func.sum(Session.final_box_count).label('total_boxes'),
                    func.avg(Session.final_box_count).label('avg_boxes')
                )
                .group_by(Session.input_mode)
            ).all()
            
            performance = {}
            for input_mode, total, completed, boxes, avg_boxes in result:
                success_rate = (completed / total * 100) if total > 0 else 0
                
                performance[input_mode] = {
                    "total_sessions": total,
                    "completed_sessions": completed,
                    "success_rate_percent": round(success_rate, 2),
                    "total_boxes_detected": boxes or 0,
                    "average_boxes_per_session": round(avg_boxes or 0, 2)
                }
            
            return performance
        except Exception as e:
            print(f"Error getting input mode performance: {str(e)}")
            return {}

# Global analytics service instance
analytics_service = AnalyticsService()

from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class Session(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    operator_id: str
    batch_id: str
    started_at: datetime = Field(default_factory=datetime.utcnow)
    stopped_at: Optional[datetime] = None
    final_box_count: int = 0
    video_path: Optional[str] = None
    challan_path: Optional[str] = None
    status: str = "active"  # active | completed | processing
    input_mode: str = "upload"  # "upload" | "live"
    uploaded_video_path: Optional[str] = None

    # Challan Fields
    customer_ms: Optional[str] = ""
    transporter_id: Optional[str] = ""
    courier_partner: Optional[str] = ""
    challan_no: Optional[str] = ""
    pickup_date: Optional[str] = ""
    # JSON-encoded list of {name: str, qty: int} — supports N products
    products_json: Optional[str] = "[]"
    # Email field for sending challan
    challan_email: Optional[str] = ""


class DetectionLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: int = Field(foreign_key="session.id")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    frame_index: int
    box_count: int
    visible_count: int

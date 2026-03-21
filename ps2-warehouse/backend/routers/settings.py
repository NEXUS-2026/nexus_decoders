from fastapi import APIRouter
from pydantic import BaseModel
import json
from pathlib import Path

router = APIRouter()

SETTINGS_FILE = Path(__file__).resolve().parent.parent.parent / "storage" / "settings.json"

class SettingsModel(BaseModel):
    confidence_threshold: float

def load_settings():
    if not SETTINGS_FILE.exists():
        return {"confidence_threshold": 0.45}
    with open(SETTINGS_FILE, "r") as f:
        return json.load(f)

def save_settings(data: dict):
    SETTINGS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(SETTINGS_FILE, "w") as f:
        json.dump(data, f)

@router.get("/")
def get_settings():
    return load_settings()

@router.post("/")
def update_settings(settings: SettingsModel):
    data = settings.dict()
    save_settings(data)
    return {"status": "success", "settings": data}

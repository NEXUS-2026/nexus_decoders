import asyncio
from pathlib import Path
from datetime import datetime, timedelta
import threading

VIDEOS_DIR = Path(__file__).parent.parent.parent / "storage" / "videos"
CHALLANS_DIR = Path(__file__).parent.parent.parent / "storage" / "challans"
RETENTION_DAYS = 30


def delete_old_files():
    cutoff = datetime.utcnow() - timedelta(days=RETENTION_DAYS)
    for directory in [VIDEOS_DIR, CHALLANS_DIR]:
        if not directory.exists():
            continue
        for file in directory.glob("*"):
            if file.is_file():
                mtime = datetime.utcfromtimestamp(file.stat().st_mtime)
                if mtime < cutoff:
                    file.unlink()


def cleanup_loop():
    """Runs in a background thread, checks once per day."""
    while True:
        delete_old_files()
        threading.Event().wait(timeout=86400)  # 24 hours


def start_cleanup_scheduler():
    t = threading.Thread(target=cleanup_loop, daemon=True)
    t.start()

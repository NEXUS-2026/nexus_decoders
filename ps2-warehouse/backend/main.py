from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from database import engine
from routers import sessions, detection, files, settings
from services.cleanup import start_cleanup_scheduler
from services.detection_runner import set_main_loop
from pathlib import Path
import asyncio

# Monkey-patch PyTorch load to avoid PyTorch 2.6+ WeightsUnpickler errors with Ultralytics models
try:
    import torch
    _original_load = torch.load
    def safe_load(*args, **kwargs):
        kwargs["weights_only"] = False
        return _original_load(*args, **kwargs)
    torch.load = safe_load
except ImportError:
    pass

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Always recreate tables to pick up schema changes (dev mode)
    from sqlmodel import SQLModel
    import models  # noqa: ensure all models are registered
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)
    start_cleanup_scheduler()
    set_main_loop(asyncio.get_running_loop())
    uploads_dir = Path(__file__).parent.parent / "storage" / "uploads"
    uploads_dir.mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(title="DECODERS Backend", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sessions.router, prefix="/api/sessions", tags=["sessions"])
app.include_router(detection.router, tags=["detection"])
app.include_router(files.router, prefix="/api/files", tags=["files"])
app.include_router(settings.router, prefix="/api/settings", tags=["settings"])



# Serve frontend build in production
frontend_build = Path(__file__).parent.parent / "frontend" / "out"
if frontend_build.exists():
    app.mount("/", StaticFiles(directory=str(frontend_build), html=True), name="frontend")

# Force reload

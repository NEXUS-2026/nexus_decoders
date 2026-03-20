from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from database import create_db
from routers import sessions, detection, files
from services.cleanup import start_cleanup_scheduler
from services.detection_runner import set_main_loop
from pathlib import Path
import asyncio


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db()
    start_cleanup_scheduler()
    # Store reference to the main event loop for the detection runner
    set_main_loop(asyncio.get_running_loop())
    # Ensure uploads directory exists
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

# Serve frontend build in production
frontend_build = Path(__file__).parent.parent / "frontend" / "out"
if frontend_build.exists():
    app.mount("/", StaticFiles(directory=str(frontend_build), html=True), name="frontend")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from database import create_db
from routers import sessions, detection, files
from services.cleanup import start_cleanup_scheduler
from pathlib import Path


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db()
    start_cleanup_scheduler()
    yield


app = FastAPI(title="PS2 Backend", lifespan=lifespan)

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

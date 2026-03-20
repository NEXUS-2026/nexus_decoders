from sqlmodel import create_engine, Session, SQLModel
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "storage" / "ps2.db"
engine = create_engine(f"sqlite:///{DB_PATH}", echo=False)


def create_db():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session

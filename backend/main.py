"""Convenience entry point so `uvicorn main:app --reload` works from backend/."""
from app.main import app  # noqa: F401

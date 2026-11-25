from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool

from app.database import models
from app.services.auth_service import get_current_user
from app.services import voice_service

router = APIRouter(prefix="/voice", tags=["Voice"])

MAX_BYTES = 25 * 1024 * 1024


@router.post("/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    language: Optional[str] = Form(None),  # "ne", "en", ... or empty for auto-detect
    current_user: models.User = Depends(get_current_user),
):
    data = await audio.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty audio")
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="Audio too large")
    try:
        text, engine = await run_in_threadpool(
            voice_service.transcribe, data, audio.filename or "audio.webm",
            audio.content_type or "audio/webm", language or None,
        )
    except voice_service.TranscriptionError as e:
        raise HTTPException(status_code=502, detail=f"Transcription failed: {e}")
    return {"text": text, "engine": engine}

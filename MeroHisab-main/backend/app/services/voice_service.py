"""Speech-to-text: OpenAI Whisper API first, local faster-whisper as fallback."""
import logging
import tempfile
import threading
from pathlib import Path
from typing import Optional, Tuple

import httpx

from app.config import settings

log = logging.getLogger("voice")

_local_model = None
_local_lock = threading.Lock()


class TranscriptionError(Exception):
    pass


def _transcribe_api(data: bytes, filename: str, content_type: str, language: Optional[str]) -> str:
    form = {"model": settings.WHISPER_API_MODEL}
    if language:
        form["language"] = language
    res = httpx.post(
        "https://api.openai.com/v1/audio/transcriptions",
        headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
        data=form,
        files={"file": (filename, data, content_type)},
        timeout=60,
    )
    if res.status_code != 200:
        raise TranscriptionError(f"Whisper API {res.status_code}: {res.text[:200]}")
    return res.json().get("text", "").strip()


def _get_local_model():
    global _local_model
    with _local_lock:
        if _local_model is None:
            from faster_whisper import WhisperModel  # imported lazily: heavy

            device = settings.WHISPER_DEVICE
            if device == "auto":
                try:
                    import ctranslate2
                    device = "cuda" if ctranslate2.get_cuda_device_count() > 0 else "cpu"
                except Exception:
                    device = "cpu"
            compute = "float16" if device == "cuda" else "int8"
            log.info("Loading local Whisper model %s on %s", settings.WHISPER_LOCAL_MODEL, device)
            try:
                _local_model = WhisperModel(settings.WHISPER_LOCAL_MODEL, device=device, compute_type=compute)
            except Exception:
                if device == "cpu":
                    raise
                _local_model = WhisperModel(settings.WHISPER_LOCAL_MODEL, device="cpu", compute_type="int8")
        return _local_model


def _transcribe_local(data: bytes, filename: str, language: Optional[str]) -> str:
    suffix = Path(filename).suffix or ".webm"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f:
        f.write(data)
        path = f.name
    try:
        segments, _ = _get_local_model().transcribe(path, language=language, beam_size=5, vad_filter=True)
        return " ".join(s.text.strip() for s in segments).strip()
    finally:
        Path(path).unlink(missing_ok=True)


def transcribe(data: bytes, filename: str, content_type: str, language: Optional[str]) -> Tuple[str, str]:
    """Returns (text, engine). Raises TranscriptionError if every engine fails."""
    errors = []
    if settings.OPENAI_API_KEY:
        try:
            return _transcribe_api(data, filename, content_type, language), "whisper-api"
        except Exception as e:  # network, quota, bad key ... -> fall back
            log.warning("Whisper API failed, falling back to local: %s", e)
            errors.append(str(e))
    try:
        return _transcribe_local(data, filename, language), "whisper-local"
    except Exception as e:
        log.exception("Local Whisper failed")
        errors.append(f"local: {e}")
    raise TranscriptionError("; ".join(errors))

from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent

_default_db = str(BASE_DIR / 'merohisab.db')

class Settings(BaseSettings):
    DATABASE_URL: str = 'sqlite:///' + _default_db
    SECRET_KEY: str = 'change-me-in-production'
    ALGORITHM: str = 'HS256'
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080
    FRONTEND_URL: str = 'http://localhost:5173'

    OPENAI_API_KEY: str = ''
    WHISPER_API_MODEL: str = 'whisper-1'
    WHISPER_LOCAL_MODEL: str = 'small'
    WHISPER_DEVICE: str = 'auto'

    GEMINI_API_KEY: str = ''

    model_config = SettingsConfigDict(env_file=str(BASE_DIR / '.env'), extra='ignore')


settings = Settings()

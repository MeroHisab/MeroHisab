from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

_url = settings.DATABASE_URL
if _url.startswith("sqlite:///./"):
    from app.config import BASE_DIR
    _url = f"sqlite:///{(BASE_DIR / _url[len('sqlite:///./'):]).as_posix()}"

if _url.startswith("sqlite"):
    engine = create_engine(_url, connect_args={"check_same_thread": False})
else:
    engine = create_engine(_url, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

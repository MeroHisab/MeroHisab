from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.database import engine, Base
from app.config import settings

from app.api.routes import auth, customers, products, transactions, categories, voice

# Create tables (In a real app, use Alembic migrations instead)
from app.database import models
Base.metadata.create_all(bind=engine)

app = FastAPI(title="MeroHisab API", version="1.0.0")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(customers.router)
app.include_router(products.router)
app.include_router(transactions.router)
app.include_router(categories.router)
app.include_router(voice.router)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/")
def root():
    return {"message": "Welcome to MeroHisab API"}

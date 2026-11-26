from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional, List
from datetime import datetime
from app.database.models import TransactionType, PaymentStatus


# ── Auth ──────────────────────────────────────────────────────
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    shop_name: Optional[str] = "My Shop"
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str]
    shop_name: Optional[str]
    location: Optional[str]
    language: str
    voice: str
    notifications: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    shop_name: Optional[str] = None
    location: Optional[str] = None
    language: Optional[str] = None
    voice: Optional[str] = None
    notifications: Optional[bool] = None


# ── Customer ──────────────────────────────────────────────────
class CustomerCreate(BaseModel):
    name: str
    phone: Optional[str] = None

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None

class CustomerOut(BaseModel):
    id: int
    name: str
    phone: Optional[str]
    outstanding: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ── Category ──────────────────────────────────────────────────
class CategoryCreate(BaseModel):
    name: str

class CategoryOut(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


# ── Product ───────────────────────────────────────────────────
class ProductCreate(BaseModel):
    name: str
    category: Optional[str] = "Others"
    price: float = 0.0
    stock: int = 0

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None

class ProductOut(BaseModel):
    id: int
    name: str
    category: Optional[str]
    price: float
    stock: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ── Transaction ───────────────────────────────────────────────
class TransactionCreate(BaseModel):
    type: TransactionType
    amount: float
    description: Optional[str] = None
    category: Optional[str] = "Others"
    status: PaymentStatus = PaymentStatus.PAID
    customer_id: Optional[int] = None
    date: Optional[datetime] = None

class TransactionUpdate(BaseModel):
    type: Optional[TransactionType] = None
    amount: Optional[float] = None
    description: Optional[str] = None
    category: Optional[str] = None
    status: Optional[PaymentStatus] = None
    customer_id: Optional[int] = None

class TransactionOut(BaseModel):
    id: int
    type: TransactionType
    amount: float
    description: Optional[str]
    category: Optional[str]
    status: PaymentStatus
    customer_id: Optional[int]
    date: datetime
    created_at: datetime
    customer: Optional[CustomerOut] = None

    model_config = ConfigDict(from_attributes=True)


# ── Reports ───────────────────────────────────────────────────
class ReportSummary(BaseModel):
    total_sales: float
    total_expenses: float
    net_profit: float
    total_credit: float
    total_repaid: float
    tx_count: int

class CategoryBreakdown(BaseModel):
    category: str
    amount: float
    pct: float

class DailyPoint(BaseModel):
    date: str
    revenue: float
    expenses: float

class ReportOut(BaseModel):
    summary: ReportSummary
    category_breakdown: List[CategoryBreakdown]
    daily_trend: List[DailyPoint]
    top_customers: List[dict]

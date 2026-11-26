from sqlalchemy import (
    Column, Integer, String, Float, Boolean,
    DateTime, ForeignKey, Text, Enum as SAEnum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database.database import Base


# ── Enums ────────────────────────────────────────────────────
class TransactionType(str, enum.Enum):
    SALE        = "SALE"
    PURCHASE    = "PURCHASE"
    EXPENSE     = "EXPENSE"
    CREDIT_SALE = "CREDIT_SALE"
    REPAYMENT   = "REPAYMENT"


class PaymentStatus(str, enum.Enum):
    PAID   = "PAID"
    UNPAID = "UNPAID"


# ── Models ───────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String, nullable=False)
    email       = Column(String, unique=True, index=True, nullable=False)
    phone       = Column(String, nullable=True)
    shop_name   = Column(String, nullable=True, default="My Shop")
    location    = Column(String, nullable=True)
    language    = Column(String, default="English")
    voice       = Column(String, default="Default (Nepali)")
    notifications = Column(Boolean, default=True)
    hashed_password = Column(String, nullable=False)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), onupdate=func.now())

    transactions = relationship("Transaction", back_populates="owner")
    customers    = relationship("Customer", back_populates="owner")
    products     = relationship("Product", back_populates="owner")
    categories   = relationship("Category", back_populates="owner")


class Category(Base):
    __tablename__ = "categories"

    id       = Column(Integer, primary_key=True, index=True)
    name     = Column(String, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    owner = relationship("User", back_populates="categories")


class Customer(Base):
    __tablename__ = "customers"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String, nullable=False)
    phone       = Column(String, nullable=True)
    outstanding = Column(Float, default=0.0)
    owner_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    owner        = relationship("User", back_populates="customers")
    transactions = relationship("Transaction", back_populates="customer")


class Product(Base):
    __tablename__ = "products"

    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String, nullable=False)
    category   = Column(String, nullable=True)
    price      = Column(Float, default=0.0)
    stock      = Column(Integer, default=0)
    owner_id   = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="products")


class Transaction(Base):
    __tablename__ = "transactions"

    id          = Column(Integer, primary_key=True, index=True)
    type        = Column(SAEnum(TransactionType), nullable=False)
    amount      = Column(Float, nullable=False)
    description = Column(Text, nullable=True)
    category    = Column(String, nullable=True, default="Others")
    status      = Column(SAEnum(PaymentStatus), default=PaymentStatus.PAID)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    owner_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    date        = Column(DateTime(timezone=True), server_default=func.now())
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    owner    = relationship("User", back_populates="transactions")
    customer = relationship("Customer", back_populates="transactions")

from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.services.auth_service import get_current_user
from app.database import models
from app.database.models import TransactionType
from app.schemas import schemas

router = APIRouter(prefix="/transactions", tags=["Transactions"])


def _get_customer(db: Session, user: models.User, customer_id: Optional[int]):
    if not customer_id:
        return None
    customer = db.query(models.Customer).filter(
        models.Customer.id == customer_id,
        models.Customer.owner_id == user.id,
    ).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


def _apply(customer, tx_type, amount, sign=1):
    """Add (sign=1) or reverse (sign=-1) a transaction's effect on a customer balance."""
    if customer is None:
        return
    if tx_type == TransactionType.CREDIT_SALE:
        customer.outstanding = max(0.0, (customer.outstanding or 0.0) + sign * amount)
    elif tx_type == TransactionType.REPAYMENT:
        customer.outstanding = max(0.0, (customer.outstanding or 0.0) - sign * amount)


def _validate(tx_type, amount, customer_id):
    if amount is not None and amount <= 0:
        raise HTTPException(status_code=422, detail="Amount must be greater than 0")
    if tx_type in (TransactionType.CREDIT_SALE, TransactionType.REPAYMENT) and not customer_id:
        raise HTTPException(status_code=422, detail="Customer is required for credit sales and repayments")


@router.get("/", response_model=List[schemas.TransactionOut])
def list_transactions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return db.query(models.Transaction).filter(
        models.Transaction.owner_id == current_user.id
    ).order_by(models.Transaction.date.desc(), models.Transaction.id.desc()).all()


@router.post("/", response_model=schemas.TransactionOut, status_code=201)
def create_transaction(
    payload: schemas.TransactionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _validate(payload.type, payload.amount, payload.customer_id)
    customer = _get_customer(db, current_user, payload.customer_id)

    data = payload.model_dump()
    if data.get("date") is None:
        data["date"] = datetime.now(timezone.utc)
    if payload.type == TransactionType.CREDIT_SALE:
        data["status"] = models.PaymentStatus.UNPAID
    elif payload.type == TransactionType.REPAYMENT:
        data["status"] = models.PaymentStatus.PAID

    _apply(customer, payload.type, payload.amount)
    tx = models.Transaction(**data, owner_id=current_user.id)
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx


@router.patch("/{tx_id}", response_model=schemas.TransactionOut)
def update_transaction(
    tx_id: int,
    payload: schemas.TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    tx = db.query(models.Transaction).filter(
        models.Transaction.id == tx_id,
        models.Transaction.owner_id == current_user.id,
    ).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    changes = payload.model_dump(exclude_unset=True)
    new_type = changes.get("type", tx.type)
    new_amount = changes.get("amount", tx.amount)
    new_customer_id = changes.get("customer_id", tx.customer_id)
    _validate(new_type, new_amount, new_customer_id)
    new_customer = _get_customer(db, current_user, new_customer_id)

    # Reverse the old effect, then apply the new one
    old_customer = (
        db.query(models.Customer).filter(models.Customer.id == tx.customer_id).first()
        if tx.customer_id else None
    )
    _apply(old_customer, tx.type, tx.amount, sign=-1)
    _apply(new_customer, new_type, new_amount)

    for key, value in changes.items():
        if key in ("date", "type", "amount", "status") and value is None:
            continue
        setattr(tx, key, value)
    if new_type == TransactionType.CREDIT_SALE and "status" not in changes:
        tx.status = models.PaymentStatus.UNPAID

    db.commit()
    db.refresh(tx)
    return tx


@router.delete("/{tx_id}", status_code=204)
def delete_transaction(
    tx_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    tx = db.query(models.Transaction).filter(
        models.Transaction.id == tx_id,
        models.Transaction.owner_id == current_user.id,
    ).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if tx.customer_id:
        customer = db.query(models.Customer).filter(models.Customer.id == tx.customer_id).first()
        _apply(customer, tx.type, tx.amount, sign=-1)

    db.delete(tx)
    db.commit()

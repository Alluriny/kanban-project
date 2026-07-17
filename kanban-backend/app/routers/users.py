from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import User
from app.dependencies import get_current_user

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/")
def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    users = db.query(User).all()
    return [{"id": u.id, "login": u.login} for u in users]

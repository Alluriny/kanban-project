from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# AUTH 
class UserCreate(BaseModel):
    login: str
    password: str

class UserLogin(BaseModel):
    login: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

# BOARDS 
class BoardCreate(BaseModel):
    title: str

class BoardUpdate(BaseModel):
    title: str
    version: int

class BoardResponse(BaseModel):
    id: str
    title: str
    owner_id: str
    version: int
    created_at: datetime

#COLUMNS 
class ColumnCreate(BaseModel):
    title: str

class ColumnUpdate(BaseModel):
    title: str

class ColumnResponse(BaseModel):
    id: str
    title: str
    order: int
    board_id: str

# CARDS
class CardCreate(BaseModel):
    title: str
    description: Optional[str] = None
    assigned_to: Optional[str] = None
    deadline: Optional[datetime] = None

class CardUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assigned_to: Optional[str] = None
    deadline: Optional[datetime] = None

class CardMove(BaseModel):
    target_column_id: str
    new_order: int

#COMMENTS
class CommentCreate(BaseModel):
    text: str

# ===== COMMENTS =====
class CommentResponse(BaseModel):
    id: str
    text: str
    card_id: str
    author_id: str
    created_at: datetime

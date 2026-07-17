from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import User, Board, ColumnModel, board_participants
from app.schemas import ColumnUpdate, ColumnResponse
from app.dependencies import get_current_user
import json

router = APIRouter(prefix="/columns", tags=["columns"])

@router.get("/board/{board_id}", response_model=List[ColumnResponse])
def get_columns(
    board_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    if board.owner_id != current_user.id:
        participant = db.execute(
            board_participants.select().where(
                board_participants.c.board_id == board_id,
                board_participants.c.user_id == current_user.id
            )
        ).first()
        if not participant:
            raise HTTPException(status_code=403, detail="Access denied")
    
    columns = db.query(ColumnModel).filter(ColumnModel.board_id == board_id).order_by(ColumnModel.order).all()
    return columns

@router.post("/", response_model=ColumnResponse)
async def create_column(
    request: Request,
    board_id: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        body = await request.body()
        data = json.loads(body)
        
        # Если пришла строка — используем её как title
        if isinstance(data, str):
            title = data
        else:
            title = data.get('title')
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Invalid request body: {str(e)}")
    
    if not title:
        raise HTTPException(status_code=422, detail="title is required")
    
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    if board.owner_id != current_user.id:
        participant = db.execute(
            board_participants.select().where(
                board_participants.c.board_id == board_id,
                board_participants.c.user_id == current_user.id
            )
        ).first()
        if not participant or participant.role not in ["admin", "member"]:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    max_order = db.query(ColumnModel).filter(ColumnModel.board_id == board_id).count()
    
    new_column = ColumnModel(
        title=title,
        order=max_order + 1,
        board_id=board_id
    )
    db.add(new_column)
    db.commit()
    db.refresh(new_column)
    return new_column

@router.patch("/{column_id}", response_model=ColumnResponse)
def update_column(
    column_id: str,
    column_data: ColumnUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    column = db.query(ColumnModel).filter(ColumnModel.id == column_id).first()
    if not column:
        raise HTTPException(status_code=404, detail="Column not found")
    
    board = db.query(Board).filter(Board.id == column.board_id).first()
    if board.owner_id != current_user.id:
        participant = db.execute(
            board_participants.select().where(
                board_participants.c.board_id == column.board_id,
                board_participants.c.user_id == current_user.id
            )
        ).first()
        if not participant or participant.role not in ["admin", "member"]:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    column.title = column_data.title
    db.commit()
    db.refresh(column)
    return column

@router.delete("/{column_id}")
def delete_column(
    column_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    column = db.query(ColumnModel).filter(ColumnModel.id == column_id).first()
    if not column:
        raise HTTPException(status_code=404, detail="Column not found")
    
    board = db.query(Board).filter(Board.id == column.board_id).first()
    if board.owner_id != current_user.id:
        participant = db.execute(
            board_participants.select().where(
                board_participants.c.board_id == column.board_id,
                board_participants.c.user_id == current_user.id
            )
        ).first()
        if not participant or participant.role not in ["admin", "member"]:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    db.delete(column)
    db.commit()
    return {"message": "Column deleted successfully"}
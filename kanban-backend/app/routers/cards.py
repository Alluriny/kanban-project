from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import User, Board, ColumnModel, Card, board_participants
from app.schemas import CardCreate, CardUpdate, CardMove
from app.dependencies import get_current_user
from datetime import datetime
import json

router = APIRouter(prefix="/cards", tags=["cards"])

@router.get("/column/{column_id}")
def get_cards(
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
        if not participant:
            raise HTTPException(status_code=403, detail="Access denied")
    
    cards = db.query(Card).filter(Card.column_id == column_id).order_by(Card.order).all()
    return cards

@router.post("/")
async def create_card(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    body = await request.body()
    data = json.loads(body)
    
    column_id = data.get('column_id') or data.get('columnId')
    if not column_id:
        raise HTTPException(status_code=422, detail="column_id is required")
    
    title = data.get('title')
    if not title:
        raise HTTPException(status_code=422, detail="title is required")
    
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
    
    max_order = db.query(Card).filter(Card.column_id == column_id).count()
    
    new_card = Card(
        title=title,
        description=data.get('description'),
        order=max_order + 1,
        deadline=data.get('deadline'),
        column_id=column_id,
        assigned_to=data.get('assigned_to')
    )
    db.add(new_card)
    db.commit()
    db.refresh(new_card)
    return new_card

@router.patch("/{card_id}")
async def update_card(
    card_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Получаем тело запроса
    body = await request.body()
    data = json.loads(body)
    
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    column = db.query(ColumnModel).filter(ColumnModel.id == card.column_id).first()
    board = db.query(Board).filter(Board.id == column.board_id).first()
    
    # Проверка прав
    if board.owner_id != current_user.id:
        participant = db.execute(
            board_participants.select().where(
                board_participants.c.board_id == column.board_id,
                board_participants.c.user_id == current_user.id
            )
        ).first()
        if not participant or participant.role not in ["admin", "member"]:
            if card.assigned_to != current_user.id:
                raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Обновляем только переданные поля
    if 'title' in data:
        card.title = data['title']
    if 'description' in data:
        card.description = data['description']
    if 'assigned_to' in data:
        card.assigned_to = data['assigned_to']
    if 'deadline' in data:
        card.deadline = data['deadline']
    
    db.commit()
    db.refresh(card)
    return card

@router.delete("/{card_id}")
def delete_card(
    card_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    column = db.query(ColumnModel).filter(ColumnModel.id == card.column_id).first()
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
    
    db.delete(card)
    db.commit()
    return {"message": "Card deleted successfully"}

@router.patch("/{card_id}/move")
def move_card(
    card_id: str,
    move_data: CardMove,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    old_column_id = card.column_id
    old_order = card.order
    
    column = db.query(ColumnModel).filter(ColumnModel.id == card.column_id).first()
    board = db.query(Board).filter(Board.id == column.board_id).first()
    if board.owner_id != current_user.id:
        participant = db.execute(
            board_participants.select().where(
                board_participants.c.board_id == column.board_id,
                board_participants.c.user_id == current_user.id
            )
        ).first()
        if not participant:
            raise HTTPException(status_code=403, detail="Access denied")
    
    target_column = db.query(ColumnModel).filter(ColumnModel.id == move_data.target_column_id).first()
    if not target_column:
        raise HTTPException(status_code=404, detail="Target column not found")
    
    try:
        if old_column_id != move_data.target_column_id:
            cards_in_old = db.query(Card).filter(
                Card.column_id == old_column_id,
                Card.order > old_order
            ).all()
            for c in cards_in_old:
                c.order -= 1
        
        cards_in_new = db.query(Card).filter(
            Card.column_id == move_data.target_column_id,
            Card.order >= move_data.new_order
        ).all()
        for c in cards_in_new:
            c.order += 1
        
        card.column_id = move_data.target_column_id
        card.order = move_data.new_order
        
        db.commit()
        return {"message": "Card moved successfully"}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

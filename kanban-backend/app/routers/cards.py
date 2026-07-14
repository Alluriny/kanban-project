from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import User, Board, ColumnModel, Card, board_participants
from app.schemas import CardCreate, CardUpdate, CardMove
from app.dependencies import get_current_user
from datetime import datetime

router = APIRouter(prefix="/cards", tags=["cards"])

#ПОЛУЧИТЬ ВСЕ КАРТОЧКИ В КОЛОНКЕ 
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

# СОЗДАТЬ КАРТОЧКУ 
@router.post("/")
def create_card(
    card: CardCreate,
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
    
    # Считаем количество карточек для order
    max_order = db.query(Card).filter(Card.column_id == column_id).count()
    
    new_card = Card(
        title=card.title,
        description=card.description,
        order=max_order + 1,
        deadline=card.deadline,
        column_id=column_id,
        assigned_to=card.assigned_to
    )
    db.add(new_card)
    db.commit()
    db.refresh(new_card)
    return new_card

# ОБНОВИТЬ КАРТОЧКУ 
@router.patch("/{card_id}")
def update_card(
    card_id: str,
    card_data: CardUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    column = db.query(ColumnModel).filter(ColumnModel.id == card.column_id).first()
    board = db.query(Board).filter(Board.id == column.board_id).first()
    
    # Проверяем права (ABAC: исполнитель может редактировать свою карточку)
    if board.owner_id != current_user.id:
        participant = db.execute(
            board_participants.select().where(
                board_participants.c.board_id == column.board_id,
                board_participants.c.user_id == current_user.id
            )
        ).first()
        
        if not participant or participant.role not in ["admin", "member"]:
            # ABAC: проверяем, является ли пользователь исполнителем
            if card.assigned_to != current_user.id:
                raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Обновляем поля
    if card_data.title is not None:
        card.title = card_data.title
    if card_data.description is not None:
        card.description = card_data.description
    if card_data.assigned_to is not None:
        card.assigned_to = card_data.assigned_to
    if card_data.deadline is not None:
        card.deadline = card_data.deadline
    
    db.commit()
    db.refresh(card)
    return card

# УДАЛИТЬ КАРТОЧКУ
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

#ПЕРЕМЕСТИТЬ КАРТОЧКУ
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
    
    # Проверяем доступ
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
    
    # Проверяем существование целевой колонки
    target_column = db.query(ColumnModel).filter(ColumnModel.id == move_data.target_column_id).first()
    if not target_column:
        raise HTTPException(status_code=404, detail="Target column not found")
    
    # ТРАНЗАКЦИЯ 
    try:
        # 1.Если колонка меняется - сдвигаем карточки в старой колонке
        if old_column_id != move_data.target_column_id:
            cards_in_old = db.query(Card).filter(
                Card.column_id == old_column_id,
                Card.order > old_order
            ).all()
            for c in cards_in_old:
                c.order -= 1
        
        # 2.Сдвигаем карточки в новой колонке
        cards_in_new = db.query(Card).filter(
            Card.column_id == move_data.target_column_id,
            Card.order >= move_data.new_order
        ).all()
        for c in cards_in_new:
            c.order += 1
        
        # 3.Обновляем саму карточку
        card.column_id = move_data.target_column_id
        card.order = move_data.new_order
        
        db.commit()
        return {"message": "Card moved successfully"}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

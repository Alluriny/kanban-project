from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import User, Board, ColumnModel, Card, Comment, board_participants
from app.schemas import CommentCreate, CommentResponse
from app.dependencies import get_current_user
from datetime import datetime

router = APIRouter(prefix="/comments", tags=["comments"])

# ===== ПОЛУЧИТЬ ВСЕ КОММЕНТАРИИ К КАРТОЧКЕ =====
@router.get("/card/{card_id}", response_model=List[CommentResponse])
def get_comments(
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
                board_participants.c.board_id == board.id,
                board_participants.c.user_id == current_user.id
            )
        ).first()
        if not participant:
            raise HTTPException(status_code=403, detail="Access denied")
    
    comments = db.query(Comment).filter(Comment.card_id == card_id).order_by(Comment.created_at).all()
    return comments

# ===== ДОБАВИТЬ КОММЕНТАРИЙ =====
@router.post("/", response_model=CommentResponse)
def add_comment(
    comment: CommentCreate,
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
                board_participants.c.board_id == board.id,
                board_participants.c.user_id == current_user.id
            )
        ).first()
        if not participant:
            raise HTTPException(status_code=403, detail="Access denied")
    
    new_comment = Comment(
        text=comment.text,
        card_id=card_id,
        author_id=current_user.id
    )
    
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment

# ===== УДАЛИТЬ КОММЕНТАРИЙ =====
@router.delete("/{comment_id}")
def delete_comment(
    comment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    card = db.query(Card).filter(Card.id == comment.card_id).first()
    column = db.query(ColumnModel).filter(ColumnModel.id == card.column_id).first()
    board = db.query(Board).filter(Board.id == column.board_id).first()
    
    if board.owner_id != current_user.id and comment.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    db.delete(comment)
    db.commit()
    return {"message": "Comment deleted successfully"}

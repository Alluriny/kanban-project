from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import User, Board, board_participants
from app.schemas import BoardCreate, BoardUpdate, BoardResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/boards", tags=["boards"])

# ПОЛУЧИТЬ ВСЕ ДОСКИ ПОЛЬЗОВАТЕЛЯ 
@router.get("/", response_model=List[BoardResponse])
def get_boards(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Доски, где пользователь является владельцем
    owned = db.query(Board).filter(Board.owner_id == current_user.id).all()
    
    # Доски, где пользователь является участником
    participant_boards = db.query(Board).join(
        board_participants,
        board_participants.c.board_id == Board.id
    ).filter(board_participants.c.user_id == current_user.id).all()
    
    # Объединяем и убираем дубликаты
    all_boards = {board.id: board for board in owned}
    for board in participant_boards:
        all_boards[board.id] = board
    
    return list(all_boards.values())

#СОЗДАТЬ ДОСКУ
@router.post("/", response_model=BoardResponse)
def create_board(
    board: BoardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Создаём доску
    new_board = Board(
        title=board.title,
        owner_id=current_user.id
    )
    db.add(new_board)
    db.flush()
    
    # Добавляем владельца как участника с ролью admin
    db.execute(
        board_participants.insert().values(
            board_id=new_board.id,
            user_id=current_user.id,
            role="admin"
        )
    )
    
    db.commit()
    db.refresh(new_board)
    return new_board

#ОБНОВИТЬ ДОСКУ
@router.patch("/{board_id}", response_model=BoardResponse)
def update_board(
    board_id: str,
    board_data: BoardUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    # Проверяем, что пользователь - владелец или админ
    if board.owner_id != current_user.id:
        participant = db.execute(
            board_participants.select().where(
                board_participants.c.board_id == board_id,
                board_participants.c.user_id == current_user.id
            )
        ).first()
        if not participant or participant.role != "admin":
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Защита от коллизий
    if board.version != board_data.version:
        raise HTTPException(
            status_code=409,
            detail="Board was modified by another user. Please refresh."
        )
    
    # Обновляем
    board.title = board_data.title
    board.version += 1
    db.commit()
    db.refresh(board)
    return board

#УДАЛИТЬ ДОСКУ
@router.delete("/{board_id}")
def delete_board(
    board_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    # Только владелец может удалить доску
    if board.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only owner can delete board")
    
    db.delete(board)
    db.commit()
    return {"message": "Board deleted successfully"}

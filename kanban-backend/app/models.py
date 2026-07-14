from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import uuid

def gen_uuid():
    return str(uuid.uuid4())

board_participants = Table(
    'board_participants',
    Base.metadata,
    Column('board_id', String, ForeignKey('boards.id', ondelete='CASCADE'), primary_key=True),
    Column('user_id', String, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
    Column('role', String, default='member')
)

class User(Base):
    __tablename__ = 'users'
    id = Column(String, primary_key=True, default=gen_uuid)
    login = Column(String, unique=True, nullable=False, index=True)
    password = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    owned_boards = relationship("Board", back_populates="owner", foreign_keys="Board.owner_id")
    assigned_cards = relationship("Card", back_populates="assignee", foreign_keys="Card.assigned_to")
    comments = relationship("Comment", back_populates="author")

class Board(Base):
    __tablename__ = 'boards'
    id = Column(String, primary_key=True, default=gen_uuid)
    title = Column(String, nullable=False)
    owner_id = Column(String, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    version = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    owner = relationship("User", back_populates="owned_boards", foreign_keys=[owner_id])
    columns = relationship("ColumnModel", back_populates="board", cascade="all, delete-orphan")
    participants = relationship("User", secondary=board_participants, backref="participating_boards")

class ColumnModel(Base):
    __tablename__ = 'columns'
    id = Column(String, primary_key=True, default=gen_uuid)
    title = Column(String, nullable=False)
    order = Column(Integer, nullable=False)
    board_id = Column(String, ForeignKey('boards.id', ondelete='CASCADE'), nullable=False)
    board = relationship("Board", back_populates="columns")
    cards = relationship("Card", back_populates="column", cascade="all, delete-orphan")

class Card(Base):
    __tablename__ = 'cards'
    id = Column(String, primary_key=True, default=gen_uuid)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    order = Column(Integer, nullable=False)
    deadline = Column(DateTime, nullable=True)
    column_id = Column(String, ForeignKey('columns.id', ondelete='CASCADE'), nullable=False)
    assigned_to = Column(String, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    column = relationship("ColumnModel", back_populates="cards")
    assignee = relationship("User", back_populates="assigned_cards", foreign_keys=[assigned_to])
    comments = relationship("Comment", back_populates="card", cascade="all, delete-orphan")

class Comment(Base):
    __tablename__ = 'comments'
    id = Column(String, primary_key=True, default=gen_uuid)
    text = Column(Text, nullable=False)
    card_id = Column(String, ForeignKey('cards.id', ondelete='CASCADE'), nullable=False)
    author_id = Column(String, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    card = relationship("Card", back_populates="comments")
    author = relationship("User", back_populates="comments")

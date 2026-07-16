import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card } from './Card';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { api } from '../api/api';

export function Column({ 
  column, 
  cards, 
  onDelete, 
  onUpdate, 
  onMoveCard, 
  onUpdateCard,  
  boardId 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(column.title);
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardDescription, setNewCardDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const { setNodeRef } = useDroppable({
    id: column.id,
    data: { columnId: column.id }
  });

  const handleUpdate = () => {
    if (title.trim() && title !== column.title) {
      onUpdate(column.id, title);
    }
    setIsEditing(false);
  };

  const handleAddCard = async () => {
    if (!newCardTitle.trim() || isCreating) return;
    
    setIsCreating(true);
    console.log('Создание карточки:', {
      columnId: column.id,
      title: newCardTitle,
      description: newCardDescription
    });

    try {
      const newCard = await api.createCard(column.id, {
        title: newCardTitle,
        description: newCardDescription,
      });
      
      console.log(' Карточка создана:', newCard);
      
      // Добавляем карточку в список
      cards.push(newCard);
      
      // Очищаем форму
      setNewCardTitle('');
      setNewCardDescription('');
      setShowAddCard(false);
      
      // Обновляем родительский компонент
      if (onUpdateCard) {
        onUpdateCard();
      }
      
    } catch (err) {
      console.log(' Ошибка:', err);
      alert('Failed to create card: ' + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="column" ref={setNodeRef}>
      <div className="column-header">
        {isEditing ? (
          <input
            className="column-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleUpdate}
            onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
            autoFocus
          />
        ) : (
          <div className="column-title" onDoubleClick={() => setIsEditing(true)}>
            {column.title}
          </div>
        )}
        <div className="column-actions">
          <button onClick={() => setIsEditing(true)}>
            <FiEdit2 size={14} />
          </button>
          <button className="danger" onClick={() => onDelete(column.id)}>
            <FiTrash2 size={14} />
          </button>
        </div>
      </div>

      <div className="card-count">{cards.length} cards</div>

      <div className="cards-list">
        <SortableContext
          items={cards.map(c => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {cards.map((card, index) => (
            <Card
              key={card.id}
              card={card}
              index={index}
              columnId={column.id}
              onMoveCard={onMoveCard}
              onUpdateCard={onUpdateCard}  
            />
          ))}
        </SortableContext>
      </div>

      {showAddCard ? (
        <div className="add-button-form">
          <input
            value={newCardTitle}
            onChange={(e) => setNewCardTitle(e.target.value)}
            placeholder="Enter card title..."
            onKeyDown={(e) => e.key === 'Enter' && handleAddCard()}
            autoFocus
          />
          <textarea
            value={newCardDescription}
            onChange={(e) => setNewCardDescription(e.target.value)}
            placeholder="Description (optional)"
            rows="2"
          />
          <div className="form-actions">
            <button className="save" onClick={handleAddCard} disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Add Card'}
            </button>
            <button className="cancel" onClick={() => setShowAddCard(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <button className="add-button" onClick={() => setShowAddCard(true)}>
          <FiPlus /> Add Card
        </button>
      )}
    </div>
  );
}
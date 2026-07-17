import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CardModal } from './CardModal';

export function Card({ card, index, columnId }) {
  const [showModal, setShowModal] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: card.id,
    data: {
      columnId,
      index,
      card
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: 'transform 300ms cubic-bezier(0.2, 0, 0, 1), box-shadow 200ms ease, opacity 200ms ease',
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 999 : 1,
    boxShadow: isDragging 
      ? '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 0 2px #5865f2' 
      : '0 1px 3px rgba(0, 0, 0, 0.3)',
    transform: isDragging 
      ? `${CSS.Transform.toString(transform)} scale(1.04)` 
      : CSS.Transform.toString(transform),
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`card-item ${isDragging ? 'dragging' : ''}`}
        {...attributes}
        {...listeners}
        onClick={() => setShowModal(true)}
      >
        <div className="card-title">{card.title}</div>
        <div className="card-footer">
          {card.assigned_to && (
            <span className="badge badge-assignee">👤 {card.assigned_to}</span>
          )}
          {card.deadline && (
            <span className="badge badge-deadline">📅 {new Date(card.deadline).toLocaleDateString()}</span>
          )}
        </div>
      </div>

      {showModal && (
        <CardModal
          card={card}
          onClose={() => setShowModal(false)}
          onUpdate={() => window.location.reload()}
        />
      )}
    </>
  );
}

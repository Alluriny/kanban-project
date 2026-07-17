import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CardModal } from './CardModal';

export function Card({ card, index, columnId, onMoveCard }) {
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
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    const isOverdue = card.deadline && new Date(card.deadline) < new Date();

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
                    <div className="card-badges">
                        {card.assigned_to && (
                            <span className="badge badge-assignee">
                                👤 {card.assigned_to}
                            </span>
                        )}
                        {card.deadline && (
                            <span className={`badge badge-deadline ${isOverdue ? 'overdue' : ''}`}>
                                📅 {new Date(card.deadline).toLocaleDateString()}
                            </span>
                        )}
                        {card.comments?.length > 0 && (
                            <span className="badge badge-comments">
                                💬 {card.comments.length}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {showModal && (
                <CardModal
                    card={card}
                    onClose={() => setShowModal(false)}
                    onUpdate={() => {
                        window.location.reload();
                    }}
                />
            )}
        </>
    );
}
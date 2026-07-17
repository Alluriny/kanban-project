import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DndContext, closestCorners } from '@dnd-kit/core';
import { Column } from '../components/Column';
import { api } from '../api/api';

function Board() {
    const { id } = useParams();
    const [columns, setColumns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadBoard();
    }, [id]);

    const loadBoard = async () => {
        try {
            setLoading(true);
            const columnsData = await api.getColumns(id);
            const columnsWithCards = await Promise.all(
                columnsData.map(async (column) => {
                    const cards = await api.getCards(column.id);
                    return { ...column, cards };
                })
            );
            setColumns(columnsWithCards);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCard = async (columnId, title, description) => {
        try {
            const newCard = await api.createCard(columnId, { title, description });
            setColumns(prev => prev.map(col => {
                if (col.id === columnId) {
                    return { ...col, cards: [...col.cards, newCard] };
                }
                return col;
            }));
            return newCard;
        } catch (err) {
            console.error('Ошибка создания карточки:', err);
            throw err;
        }
    };

    const handleMoveCard = async (cardId, targetColumnId, newOrder) => {
        if (!cardId || cardId === 'null') {
            console.warn('Move skipped: cardId is', cardId);
            return;
        }

        let sourceColumnId = null;
        let cardData = null;
        for (const col of columns) {
            const found = col.cards.find(c => c.id === cardId);
            if (found) {
                sourceColumnId = col.id;
                cardData = found;
                break;
            }
        }

        if (!sourceColumnId || !cardData) return;

        const oldColumns = [...columns];

        try {
            setColumns(prev => {
                const newColumns = prev.map(col => {
                    if (col.id === sourceColumnId) {
                        return { ...col, cards: col.cards.filter(c => c.id !== cardId) };
                    }
                    if (col.id === targetColumnId) {
                        const newCards = [...col.cards];
                        newCards.splice(newOrder, 0, { ...cardData, column_id: targetColumnId });
                        return { ...col, cards: newCards };
                    }
                    return col;
                });
                return newColumns;
            });

            await api.moveCard(cardId, targetColumnId, newOrder);
        } catch (err) {
            setColumns(oldColumns);
            console.error('Ошибка перемещения:', err);
        }
    };

    const handleCreateColumn = async (title) => {
        try {
            const newColumn = await api.createColumn(id, { title });
            setColumns(prev => [...prev, { ...newColumn, cards: [] }]);
        } catch (err) {
            console.error('Ошибка создания колонки:', err);
        }
    };

    const handleDeleteColumn = async (columnId) => {
        try {
            await api.deleteColumn(columnId);
            setColumns(prev => prev.filter(col => col.id !== columnId));
        } catch (err) {
            console.error('Ошибка удаления колонки:', err);
        }
    };

    if (loading) return <div className="loading">Загрузка...</div>;
    if (error) return <div className="error">Ошибка: {error}</div>;

    return (
        <div className="board-container">
            <div className="board-header">
                <h1>Доска</h1>
                <button 
                    className="btn-add-column"
                    onClick={() => {
                        const title = prompt('Введите название колонки:');
                        if (title) handleCreateColumn(title);
                    }}
                >
                    + Добавить колонку
                </button>
            </div>

            <DndContext
                collisionDetection={closestCorners}
                onDragEnd={(event) => {
                    const { active, over } = event;
                    if (!over) return;

                    const cardId = active.id;
                    const targetColumnId = over.data.current?.columnId;
                    const newOrder = over.data.current?.index;

                    if (cardId && cardId !== 'null' && targetColumnId !== undefined) {
                        handleMoveCard(cardId, targetColumnId, newOrder);
                    } else {
                        console.warn('Move skipped: invalid data', { cardId, targetColumnId });
                    }
                }}
            >
                <div className="columns-container">
                    {columns.map((column) => (
                        <Column
                            key={column.id}
                            column={column}
                            cards={column.cards || []}
                            onMoveCard={handleMoveCard}
                            onCreateCard={handleCreateCard}
                            onDeleteColumn={handleDeleteColumn}
                        />
                    ))}
                </div>
            </DndContext>
        </div>
    );
}

export default Board;
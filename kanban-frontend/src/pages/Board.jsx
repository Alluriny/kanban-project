import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Column } from '../components/Column';
import { api } from '../api/api';
import { FiPlus, FiArrowLeft } from 'react-icons/fi';

function Board() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  useEffect(() => {
    if (id) loadBoard();
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

  const handleCreateColumn = async () => {
    if (!newColumnTitle.trim()) return;
    try {
      const newColumn = await api.createColumn(id, newColumnTitle);
      setColumns(prev => [...prev, { ...newColumn, cards: [] }]);
      setNewColumnTitle('');
      setShowModal(false);
    } catch (err) {
      console.error('Error creating column:', err);
    }
  };

  const handleDeleteColumn = async (columnId) => {
    try {
      await api.deleteColumn(columnId);
      setColumns(prev => prev.filter(col => col.id !== columnId));
    } catch (err) {
      console.error('Error deleting column:', err);
    }
  };

  const handleUpdateColumn = async (columnId, title) => {
    try {
      await api.updateColumn(columnId, title);
      setColumns(prev => prev.map(col =>
        col.id === columnId ? { ...col, title } : col
      ));
    } catch (err) {
      console.error('Error updating column:', err);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;

    const cardId = active.id;
    const targetColumnId = over.data.current?.columnId;
    const newOrder = over.data.current?.index;

    if (!cardId || !targetColumnId) return;

    // Находим исходную колонку
    let sourceColumnId = null;
    let cardData = null;
    let sourceIndex = -1;

    for (const col of columns) {
      const foundIndex = col.cards.findIndex(c => c.id === cardId);
      if (foundIndex !== -1) {
        sourceColumnId = col.id;
        cardData = col.cards[foundIndex];
        sourceIndex = foundIndex;
        break;
      }
    }

    if (!sourceColumnId || !cardData) return;

    const oldColumns = [...columns];

    // ✅ Если перемещение внутри одной колонки
    if (sourceColumnId === targetColumnId) {
      const finalOrder = newOrder !== undefined ? newOrder : sourceIndex;
      
      setColumns(prev => {
        return prev.map(col => {
          if (col.id === sourceColumnId) {
            const newCards = arrayMove(col.cards, sourceIndex, finalOrder);
            return { ...col, cards: newCards };
          }
          return col;
        });
      });

      try {
        await api.moveCard(cardId, targetColumnId, finalOrder);
      } catch (err) {
        setColumns(oldColumns);
        console.error('Error moving card:', err);
      }
      return;
    }

    // ✅ Перемещение между разными колонками
    const finalOrder = newOrder !== undefined ? newOrder : (columns.find(c => c.id === targetColumnId)?.cards.length || 0);

    setColumns(prev => {
      const newColumns = prev.map(col => {
        if (col.id === sourceColumnId) {
          return { ...col, cards: col.cards.filter(c => c.id !== cardId) };
        }
        if (col.id === targetColumnId) {
          const newCards = [...col.cards];
          newCards.splice(finalOrder, 0, { ...cardData, column_id: targetColumnId });
          return { ...col, cards: newCards };
        }
        return col;
      });
      return newColumns;
    });

    try {
      await api.moveCard(cardId, targetColumnId, finalOrder);
    } catch (err) {
      setColumns(oldColumns);
      console.error('Error moving card:', err);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="board-container">
      <div className="board-header">
        <div className="board-header-left">
          <button className="back-btn" onClick={() => navigate('/boards')}>
            <FiArrowLeft size={20} />
            Back to boards
          </button>
          <h2>Board</h2>
        </div>
      </div>

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="columns-container">
          {columns.map((column) => (
            <Column
              key={column.id}
              column={column}
              cards={column.cards || []}
              onDelete={handleDeleteColumn}
              onUpdate={handleUpdateColumn}
            />
          ))}
          <div className="add-column-btn" onClick={() => setShowModal(true)}>
            <FiPlus size={28} />
            <span>Add column</span>
          </div>
        </div>
      </DndContext>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create column</h2>
            <div className="form-group">
              <label>Column title</label>
              <input
                type="text"
                placeholder="Enter column name..."
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateColumn()}
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button className="cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="save" onClick={handleCreateColumn}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Board;

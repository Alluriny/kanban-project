import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/api';
import { Column } from '../components/Column';
import { FiArrowLeft, FiPlus } from 'react-icons/fi';

function Board() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');

  const loadBoard = async () => {
    try {
      setLoading(true);
      const data = await api.getBoards(); // Получаем все доски
      const found = data.find(b => b.id === id);
      if (found) {
        setBoard(found);
        // Загружаем колонки (если есть отдельный эндпоинт)
        // Или можно получить из данных
        const columnsData = await api.getColumns(id);
        setColumns(columnsData || []);
      } else {
        navigate('/boards');
      }
    } catch (err) {
      navigate('/boards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBoard();
  }, [id]);

  const handleAddColumn = async () => {
    if (!newColumnTitle.trim()) return;
    try {
      const column = await api.createColumn(id, newColumnTitle);
      setColumns([...columns, column]);
      setNewColumnTitle('');
      setShowAddColumn(false);
    } catch (err) {
      alert('Failed to create column');
    }
  };

  const handleDeleteColumn = async (columnId) => {
    if (!window.confirm('Delete this column and all cards?')) return;
    try {
      await api.deleteColumn(columnId);
      setColumns(columns.filter(c => c.id !== columnId));
    } catch (err) {
      alert('Failed to delete column');
    }
  };

  const handleUpdateColumn = async (columnId, title) => {
    try {
      const updated = await api.updateColumn(columnId, title);
      setColumns(columns.map(c => c.id === columnId ? updated : c));
    } catch (err) {
      alert('Failed to update column');
    }
  };

  const handleMoveCard = async (cardId, targetColumnId, newOrder) => {
    try {
      await api.moveCard(cardId, targetColumnId, newOrder);
      // Обновляем локальное состояние
      const updatedColumns = await api.getColumns(id);
      setColumns(updatedColumns);
    } catch (err) {
      alert('Failed to move card');
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="board-page">
      <div className="board-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="back-btn" onClick={() => navigate('/boards')}>
            <FiArrowLeft /> Back
          </button>
          <h2>{board?.title || 'Board'}</h2>
        </div>
      </div>

      <div className="columns-container">
        {columns.map((column) => (
          <Column
            key={column.id}
            column={column}
            cards={column.cards || []}
            onDelete={handleDeleteColumn}
            onUpdate={handleUpdateColumn}
            onMoveCard={handleMoveCard}
            boardId={id}
          />
        ))}

        <div className="column" style={{ background: 'transparent', padding: '0' }}>
          {showAddColumn ? (
            <div className="add-button-form">
              <input
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                placeholder="Enter column name..."
                onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
                autoFocus
              />
              <div className="form-actions">
                <button className="save" onClick={handleAddColumn}>Add</button>
                <button className="cancel" onClick={() => setShowAddColumn(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <button className="add-button" onClick={() => setShowAddColumn(true)}>
              <FiPlus /> Add Column
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Board;
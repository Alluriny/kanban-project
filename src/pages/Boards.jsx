import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/api';
import { FiPlus, FiEdit2, FiTrash2, FiLogOut } from 'react-icons/fi';

function Boards() {
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState(null);

  const loadBoards = async () => {
    try {
      setLoading(true);
      const data = await api.getBoards();
      setBoards(data || []);
    } catch (err) {
      if (err.message.includes('401')) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBoards();
  }, []);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    try {
      const board = await api.createBoard(newTitle);
      setBoards([...boards, board]);
      setNewTitle('');
      setShowCreate(false);
    } catch (err) {
      alert('Failed to create board');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this board?')) return;
    try {
      await api.deleteBoard(id);
      setBoards(boards.filter(b => b.id !== id));
    } catch (err) {
      alert('Failed to delete board');
    }
  };

  const handleUpdate = async (id, title, version) => {
    try {
      const updated = await api.updateBoard(id, title, version);
      setBoards(boards.map(b => b.id === id ? updated : b));
      setEditingId(null);
    } catch (err) {
      alert('Failed to update board');
    }
  };

  const getInitials = (login) => {
    return login ? login.charAt(0).toUpperCase() : 'U';
  };

  return (
    <div className="boards-page">
      <div className="boards-header">
        <h1>📋 Your Boards</h1>
        <div className="user-info">
          <div className="avatar">
            {getInitials(localStorage.getItem('userLogin') || 'U')}
          </div>
          <button 
            className="btn-icon"
            onClick={() => {
              localStorage.removeItem('token');
              navigate('/login');
            }}
          >
            <FiLogOut size={20} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner" />
        </div>
      ) : (
        <div className="boards-grid">
          {boards.map(board => (
            <div key={board.id} className="board-card">
              <div onClick={() => navigate(`/board/${board.id}`)}>
                {editingId === board.id ? (
                  <input
                    className="board-title-input"
                    defaultValue={board.title}
                    onBlur={(e) => handleUpdate(board.id, e.target.value, board.version)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleUpdate(board.id, e.target.value, board.version);
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <div className="board-title">{board.title}</div>
                )}
                <div className="board-meta">
                  Created: {new Date(board.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="board-actions">
                <button 
                  className="btn-icon"
                  onClick={() => setEditingId(board.id)}
                >
                  <FiEdit2 />
                </button>
                <button 
                  className="btn-icon danger"
                  onClick={() => handleDelete(board.id)}
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}

          <div className="add-board-card" onClick={() => setShowCreate(true)}>
            <FiPlus size={32} />
            <span>Create Board</span>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create Board</h2>
            <div className="form-group">
              <label>Board Name</label>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Enter board name..."
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button className="cancel" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button className="save" onClick={handleCreate}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Boards;
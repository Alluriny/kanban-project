import React, { useState, useEffect } from 'react';
import { api } from '../api/api';

export function CardModal({ card, onClose, onUpdate }) {
  const [form, setForm] = useState({
    title: card.title || '',
    description: card.description || '',
    assigned_to: card.assigned_to || '',
    deadline: card.deadline ? card.deadline.split('T')[0] : '',
  });
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadComments();
    loadUsers();
  }, []);

  const loadComments = async () => {
    try {
      const data = await api.getComments(card.id);
      setComments(data || []);
    } catch (err) {
      console.error('Failed to load comments');
    }
  };

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data || []);
    } catch (err) {
      console.error('Failed to load users');
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // ✅ ИСПРАВЛЕНО: преобразуем пустую строку в null
      const dataToSend = {
        title: form.title,
        description: form.description,
        assigned_to: form.assigned_to || null,
        deadline: form.deadline || null,  // ← пустая строка → null
      };
      
      await api.updateCard(card.id, dataToSend);
      onUpdate?.();
      onClose();
    } catch (err) {
      alert('Failed to update card');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this card?')) return;
    try {
      await api.deleteCard(card.id);
      onUpdate?.();
      onClose();
    } catch (err) {
      alert('Failed to delete card');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      await api.addComment(card.id, newComment);
      setNewComment('');
      await loadComments();
    } catch (err) {
      alert('Failed to add comment');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Edit Card</h2>

        <div className="form-group">
          <label>Title</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Card title..."
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description..."
            rows="4"
          />
        </div>

        <div className="form-group">
          <label>Assignee</label>
          <select
            value={form.assigned_to}
            onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
          >
            <option value="">Unassigned</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.login}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Deadline</label>
          <input
            type="date"
            value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
          />
        </div>

        <div className="comments-section">
          <h4>Comments ({comments.length})</h4>

          <div className="comment-form">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
            />
            <button onClick={handleAddComment}>Send</button>
          </div>

          {comments.map(comment => (
            <div key={comment.id} className="comment-item">
              <div className="comment-body">
                <div className="comment-author">
                  {comment.author?.login || 'Unknown'}
                  <span className="comment-time">
                    {new Date(comment.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="comment-text">{comment.text}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <button className="delete" onClick={handleDelete}>Delete</button>
          <button className="cancel" onClick={onClose}>Cancel</button>
          <button className="save" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

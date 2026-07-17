const API_URL = 'http://localhost:8000';

export const api = {
  login: async (login, password) => {
    console.log('✅ LOGIN CALLED:', login);
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password })
    });
    const data = await response.json();
    console.log('✅ LOGIN RESPONSE:', data);
    if (!response.ok) throw new Error(data.detail || 'Login failed');
    return data;
  },

  register: async (login, password) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Registration failed');
    return data;
  },

  getBoards: async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/boards/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  createBoard: async (title) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/boards/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ title })
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  updateBoard: async (id, title, version) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/boards/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ title, version })
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  deleteBoard: async (id) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/boards/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  getColumns: async (boardId) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/columns/board/${boardId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  createColumn: async (boardId, title) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/columns?board_id=${boardId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ title })
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  updateColumn: async (id, title) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/columns/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ title })
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  deleteColumn: async (id) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/columns/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  getCards: async (columnId) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/cards/column/${columnId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  createCard: async (columnId, data) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/cards/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ ...data, column_id: columnId })
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  updateCard: async (id, data) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/cards/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  deleteCard: async (id) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/cards/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  moveCard: async (cardId, targetColumnId, newOrder) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/cards/${cardId}/move`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ target_column_id: targetColumnId, new_order: newOrder })
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  addComment: async (cardId, text) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/comments?card_id=${cardId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ text })
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  getComments: async (cardId) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/comments/card/${cardId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  },

  getUsers: async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  }
};
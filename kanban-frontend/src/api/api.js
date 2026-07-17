const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const api = {
  register: async (login, password) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password })
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Registration failed');
    return res.json();
  },

  login: async (login, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password })
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Login failed');
    return res.json();
  },

  getBoards: async () => authFetch('/boards/'),
  createBoard: async (title) => authFetch('/boards/', { method: 'POST', body: title }),
  updateBoard: async (id, title, version) => authFetch(`/boards/${id}`, { method: 'PATCH', body: { title, version } }),
  deleteBoard: async (id) => authFetch(`/boards/${id}`, { method: 'DELETE' }),

  getColumns: async (boardId) => authFetch(`/columns/board/${boardId}`),
  createColumn: async (boardId, title) => authFetch(`/columns?board_id=${boardId}`, { method: 'POST', body: title }),
  updateColumn: async (id, title) => authFetch(`/columns/${id}`, { method: 'PATCH', body: { title } }),
  deleteColumn: async (id) => authFetch(`/columns/${id}`, { method: 'DELETE' }),

  getCards: async (columnId) => authFetch(`/cards/column/${columnId}`),
  
  // ✅ ИСПРАВЛЕНО: отправляем ТОЛЬКО изменяемые поля
  createCard: async (columnId, data) => authFetch(`/cards/`, {
    method: 'POST',
    body: { ...data, column_id: columnId }
  }),
  
  updateCard: async (id, data) => {
    const cleanedData = {};
    if (data.title !== undefined) cleanedData.title = data.title;
    if (data.description !== undefined) cleanedData.description = data.description;
    if (data.assigned_to !== undefined) cleanedData.assigned_to = data.assigned_to;
    if (data.deadline !== undefined) cleanedData.deadline = data.deadline;
    
    return authFetch(`/cards/${id}`, {
      method: 'PATCH',
      body: cleanedData
    });
  },
  
  deleteCard: async (id) => authFetch(`/cards/${id}`, { method: 'DELETE' }),
  moveCard: async (cardId, targetColumnId, newOrder) => authFetch(`/cards/${cardId}/move`, {
    method: 'PATCH',
    body: { target_column_id: targetColumnId, new_order: newOrder }
  }),

  addComment: async (cardId, text) => authFetch(`/comments?card_id=${cardId}`, { method: 'POST', body: { text } }),
  getComments: async (cardId) => authFetch(`/comments/card/${cardId}`),

  getUsers: async () => authFetch('/users')
};

const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || 'Request failed');
  }
  return res.json();
};

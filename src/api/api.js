const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const USE_MOCK = true;

// ===== MOCK DATA =====
let mockUsers = [
  { id: '1', login: 'test', password: '123456' }
];
let mockBoards = [];
let mockColumns = [];
let mockCards = [];
let mockComments = [];
let mockIdCounter = 100;

// ===== MOCK AUTH =====
const mockAuth = {
  register: async (login, password) => {
    console.log('📝 Регистрация:', login, password);
    const existing = mockUsers.find(u => u.login === login);
    if (existing) {
      console.log('❌ Пользователь уже существует');
      throw new Error('Login already exists');
    }
    const newUser = { id: String(++mockIdCounter), login, password };
    mockUsers.push(newUser);
    console.log('✅ Пользователь создан:', newUser);
    return { access_token: 'mock_token_' + newUser.id, token_type: 'bearer' };
  },
  
  login: async (login, password) => {
    console.log('🔑 Вход:', login, password);
    const user = mockUsers.find(u => u.login === login && u.password === password);
    if (!user) {
      console.log('❌ Неверные данные');
      throw new Error('Invalid credentials');
    }
    console.log('✅ Вход выполнен:', user);
    return { access_token: 'mock_token_' + user.id, token_type: 'bearer' };
  }
};

// ===== MOCK CRUD =====
const mockCrud = {
  getBoards: async () => {
    console.log('📋 Получение досок:', mockBoards);
    return mockBoards;
  },
  
  createBoard: async (title) => {
    // ✅ ЗАЩИТА ОТ ДУБЛИКАТОВ
    const lastBoard = mockBoards[mockBoards.length - 1];
    if (lastBoard && lastBoard.title === title) {
      console.log('⚠️ Дубликат доски, пропускаем');
      return lastBoard;
    }
    
    const board = { 
      id: String(++mockIdCounter), 
      title, 
      owner_id: '1',
      created_at: new Date().toISOString(),
      version: 0
    };
    mockBoards.push(board);
    console.log('📋 Создана доска:', board);
    return board;
  },
  
  updateBoard: async (id, title, version) => {
    const board = mockBoards.find(b => b.id === id);
    if (board) {
      board.title = title;
      board.version = (board.version || 0) + 1;
      return board;
    }
    throw new Error('Board not found');
  },
  
  deleteBoard: async (id) => {
    mockBoards = mockBoards.filter(b => b.id !== id);
    return { success: true };
  },
  
  getColumns: async (boardId) => {
    return mockColumns.filter(c => c.boardId === boardId);
  },
  
  createColumn: async (boardId, title) => {
    const column = {
      id: String(++mockIdCounter),
      title,
      boardId,
      order: mockColumns.filter(c => c.boardId === boardId).length,
      cards: []
    };
    mockColumns.push(column);
    return column;
  },
  
  updateColumn: async (id, title) => {
    const col = mockColumns.find(c => c.id === id);
    if (col) { col.title = title; return col; }
    throw new Error('Column not found');
  },
  
  deleteColumn: async (id) => {
    mockColumns = mockColumns.filter(c => c.id !== id);
    mockCards = mockCards.filter(c => c.columnId !== id);
    return { success: true };
  },
  
  createCard: async (columnId, data) => {
    const card = {
      id: String(++mockIdCounter),
      ...data,
      columnId,
      order: mockCards.filter(c => c.columnId === columnId).length,
      created_at: new Date().toISOString(),
      comments: []
    };
    mockCards.push(card);
    return card;
  },
  
  updateCard: async (id, data) => {
    const card = mockCards.find(c => c.id === id);
    if (card) { Object.assign(card, data); return card; }
    throw new Error('Card not found');
  },
  
  deleteCard: async (id) => {
    mockCards = mockCards.filter(c => c.id !== id);
    mockComments = mockComments.filter(c => c.cardId !== id);
    return { success: true };
  },
  
  moveCard: async (cardId, targetColumnId, newOrder) => {
    const card = mockCards.find(c => c.id === cardId);
    if (card) {
      mockCards.filter(c => c.columnId === targetColumnId && c.order >= newOrder)
        .forEach(c => c.order++);
      card.columnId = targetColumnId;
      card.order = newOrder;
      return { success: true };
    }
    throw new Error('Card not found');
  },
  
  addComment: async (cardId, text) => {
    const comment = {
      id: String(++mockIdCounter),
      text,
      cardId,
      authorId: '1',
      author: { id: '1', login: 'test' },
      created_at: new Date().toISOString()
    };
    mockComments.push(comment);
    return comment;
  },
  
  getComments: async (cardId) => {
    return mockComments.filter(c => c.cardId === cardId);
  },
  
  getUsers: async () => {
    return mockUsers.map(u => ({ id: u.id, login: u.login }));
  }
};

// ===== ОСНОВНОЙ API =====
export const api = {
  // Auth
  register: async (login, password) => {
    console.log('🟣 api.register вызван с:', login, password);
    if (USE_MOCK) {
      return mockAuth.register(login, password);
    }
    return fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password })
    }).then(r => r.json());
  },

  login: async (login, password) => {
    console.log('🟣 api.login вызван с:', login, password);
    if (USE_MOCK) {
      return mockAuth.login(login, password);
    }
    return fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password })
    }).then(r => r.json());
  },

  // Boards
  getBoards: async () => {
    if (USE_MOCK) return mockCrud.getBoards();
    return authFetch('/boards');
  },
  
  createBoard: async (title) => {
    if (USE_MOCK) return mockCrud.createBoard(title);
    return authFetch('/boards', { method: 'POST', body: { title } });
  },

  updateBoard: async (id, title, version) => {
    if (USE_MOCK) return mockCrud.updateBoard(id, title, version);
    return authFetch(`/boards/${id}`, { method: 'PATCH', body: { title, version } });
  },

  deleteBoard: async (id) => {
    if (USE_MOCK) return mockCrud.deleteBoard(id);
    return authFetch(`/boards/${id}`, { method: 'DELETE' });
  },

  // Columns
  getColumns: async (boardId) => {
    if (USE_MOCK) return mockCrud.getColumns(boardId);
    return authFetch(`/boards/${boardId}/columns`);
  },

  createColumn: async (boardId, title) => {
    if (USE_MOCK) return mockCrud.createColumn(boardId, title);
    return authFetch(`/boards/${boardId}/columns`, { method: 'POST', body: { title } });
  },

  updateColumn: async (id, title) => {
    if (USE_MOCK) return mockCrud.updateColumn(id, title);
    return authFetch(`/columns/${id}`, { method: 'PATCH', body: { title } });
  },

  deleteColumn: async (id) => {
    if (USE_MOCK) return mockCrud.deleteColumn(id);
    return authFetch(`/columns/${id}`, { method: 'DELETE' });
  },

  // Cards
  createCard: async (columnId, data) => {
    if (USE_MOCK) return mockCrud.createCard(columnId, data);
    return authFetch(`/columns/${columnId}/cards`, { method: 'POST', body: data });
  },

  updateCard: async (id, data) => {
    if (USE_MOCK) return mockCrud.updateCard(id, data);
    return authFetch(`/cards/${id}`, { method: 'PATCH', body: data });
  },

  deleteCard: async (id) => {
    if (USE_MOCK) return mockCrud.deleteCard(id);
    return authFetch(`/cards/${id}`, { method: 'DELETE' });
  },

  moveCard: async (cardId, targetColumnId, newOrder) => {
    if (USE_MOCK) return mockCrud.moveCard(cardId, targetColumnId, newOrder);
    return authFetch(`/cards/${cardId}/move`, {
      method: 'PATCH',
      body: { target_column_id: targetColumnId, new_order: newOrder }
    });
  },

  // Comments
  addComment: async (cardId, text) => {
    if (USE_MOCK) return mockCrud.addComment(cardId, text);
    return authFetch(`/cards/${cardId}/comments`, { method: 'POST', body: { text } });
  },

  getComments: async (cardId) => {
    if (USE_MOCK) return mockCrud.getComments(cardId);
    return authFetch(`/cards/${cardId}/comments`);
  },

  // Users
  getUsers: async () => {
    if (USE_MOCK) return mockCrud.getUsers();
    return authFetch('/users');
  }
};

// Helper для авторизованных запросов (реальный бэк)
const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Request failed');
  }
  return response.json();
};
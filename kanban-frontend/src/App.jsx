import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Boards from './pages/Boards';
import Board from './pages/Board';

function App() {
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/boards" 
          element={isAuthenticated ? <Boards /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/board/:id" 
          element={isAuthenticated ? <Board /> : <Navigate to="/login" />} 
        />
        <Route path="/" element={<Navigate to="/boards" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/api';

function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🔵 ФОРМА ОТПРАВЛЕНА!', { login, password });
    setError('');
    setLoading(true);

    try {
      console.log('🟣 Вызов API...');
      const response = await (isLogin ? api.login : api.register)(login, password);
      console.log('🟢 Ответ:', response);
      
      if (response.access_token) {
        localStorage.setItem('token', response.access_token);
        localStorage.setItem('userLogin', login);
        console.log('✅ Токен сохранен, редирект...');
        navigate('/boards');
      } else {
        setError(response.detail || 'Something went wrong');
      }
    } catch (err) {
      console.log('🔴 Ошибка:', err);
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
        <p className="subtitle">
          {isLogin ? 'Sign in to your Kanban board' : 'Start managing your tasks'}
        </p>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Login</label>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="Enter your login"
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <button className="btn-secondary" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Create an account' : 'Already have an account?'}
        </button>
      </div>
    </div>
  );
}

export default Login;
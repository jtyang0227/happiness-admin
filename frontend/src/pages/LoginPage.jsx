import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { postApi } from '../utils/api';
import './LoginPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await postApi('/auth/login', { email, password });
      login({ name: res.name, email: res.email, authority: res.authority }, res.token);
      navigate('/');
    } catch (err) {
      setError(err.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">✨</div>
        <h1 className="login-title">Happiness Admin</h1>
        <p className="login-subtitle">관리자 계정으로 로그인하세요</p>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>이메일</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="admin@happiness.dev" required />
          </div>
          <div className="form-group">
            <label>비밀번호</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required />
          </div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
        <p className="login-hint">개발용 계정: admin@happiness.dev / Admin123!</p>
      </div>
    </div>
  );
};

export default LoginPage;

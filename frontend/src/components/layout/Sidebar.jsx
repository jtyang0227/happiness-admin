import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const NAV_ITEMS = [
  { path: '/',           label: '대시보드',    icon: '📊' },
  { path: '/members',    label: '회원 관리',   icon: '👥' },
  { path: '/photos',     label: '사진 관리',   icon: '📷' },
  { path: '/inquiries',  label: '문의 관리',   icon: '📬' },
  { path: '/series',     label: '시리즈 관리', icon: '🗂️' },
  { path: '/stats',      label: '통계',        icon: '📈' },
  { path: '/system',     label: '시스템 설정', icon: '⚙️' },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-logo">✨</span>
        <span className="sidebar-title">Happiness Admin</span>
      </div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ path, label, icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span className="sidebar-icon">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <span className="user-name">{user?.name}</span>
          <span className="user-role">{user?.authority}</span>
        </div>
        <button className="logout-btn" onClick={handleLogout}>로그아웃</button>
      </div>
    </aside>
  );
};

export default Sidebar;

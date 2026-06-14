import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Image, MessageSquare,
  BookOpen, BarChart2, Settings, LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const NAV_ITEMS = [
  { path: '/',          label: '대시보드',    Icon: LayoutDashboard },
  { path: '/members',   label: '회원 관리',   Icon: Users },
  { path: '/photos',    label: '사진 관리',   Icon: Image },
  { path: '/inquiries', label: '문의 관리',   Icon: MessageSquare },
  { path: '/series',    label: '시리즈 관리', Icon: BookOpen },
  { path: '/stats',     label: '통계',        Icon: BarChart2 },
  { path: '/system',    label: '시스템 설정', Icon: Settings },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name ? user.name.slice(0, 2) : 'AD';

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-logo"><Sparkles size={20} /></span>
        <span className="sidebar-title">Happiness Admin</span>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ path, label, Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span className="sidebar-icon"><Icon size={16} strokeWidth={1.75} /></span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar">{initials}</div>
          <span className="user-name">{user?.name}</span>
          <span className="user-role">{user?.authority}</span>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={14} strokeWidth={2} />
          로그아웃
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

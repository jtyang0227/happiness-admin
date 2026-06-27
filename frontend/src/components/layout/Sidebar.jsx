import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Image, MessageSquare,
  BookOpen, BarChart2, Settings, LogOut,
  Sparkles, X, FolderOpen, ArrowUpDown, ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const SORT_ITEMS = [
  { path: '/sort/photos',  label: '사진 정렬' },
  { path: '/sort/series',  label: '시리즈 정렬' },
];

const NAV_ITEMS = [
  { path: '/',           label: '대시보드',   Icon: LayoutDashboard },
  { path: '/members',    label: '회원 관리',  Icon: Users },
  { path: '/photos',     label: '사진 관리',  Icon: Image },
  { path: '/portfolios', label: '포트폴리오', Icon: FolderOpen },
  { path: '/series',     label: '시리즈',     Icon: BookOpen },
  { path: '/inquiries',  label: '문의 관리',  Icon: MessageSquare },
  { path: '/stats',      label: '통계',       Icon: BarChart2 },
  { path: '/system',     label: '시스템',     Icon: Settings },
];

const Sidebar = ({ isOpen = true, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sortOpen, setSortOpen] = useState(() =>
    location.pathname.startsWith('/sort')
  );

  useEffect(() => {
    onClose?.();
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (location.pathname.startsWith('/sort')) setSortOpen(true);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name ? user.name.slice(0, 2) : 'AD';

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-header">
        <span className="sidebar-logo"><Sparkles size={20} /></span>
        <span className="sidebar-title">Happiness Admin</span>
        <button className="sidebar-close" onClick={onClose} aria-label="사이드바 닫기">
          <X size={18} />
        </button>
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

        {/* 정렬 관리 accordion */}
        <div className={`sidebar-group${sortOpen ? ' open' : ''}`}>
          <button
            className={`sidebar-link sidebar-group-trigger${location.pathname.startsWith('/sort') ? ' active' : ''}`}
            onClick={() => setSortOpen(v => !v)}
          >
            <span className="sidebar-icon"><ArrowUpDown size={16} strokeWidth={1.75} /></span>
            <span>정렬 관리</span>
            <ChevronDown size={13} className="sidebar-chevron" />
          </button>
          <div className="sidebar-sub">
            {SORT_ITEMS.map(({ path, label }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) => `sidebar-sub-link${isActive ? ' active' : ''}`}
              >
                {label}
              </NavLink>
            ))}
          </div>
        </div>
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

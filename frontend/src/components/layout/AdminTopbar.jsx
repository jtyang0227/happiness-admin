import React, { useState, useEffect, useCallback } from 'react';
import { Menu, Search, ChevronDown, LogOut, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminTopbar.css';

const getStoredTheme = () => localStorage.getItem('theme') || 'light';

const applyTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
};

const AdminTopbar = ({ onMenuClick, sidebarCollapsed, onSearchClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [theme, setTheme] = useState(getStoredTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const initials = user?.name ? user.name.slice(0, 2) : 'AD';

  return (
    <header className="admin-topbar">
      <div className="topbar-left">
        <button className="topbar-menu-btn" onClick={onMenuClick} aria-label="사이드바 토글">
          <Menu size={18} />
        </button>
        <span className="topbar-logo">
          <span className="topbar-logo-dot" />
          <span className="topbar-logo-text">Happiness Admin</span>
        </span>
      </div>

      <div className="topbar-center">
        <button className="topbar-search" onClick={onSearchClick} type="button">
          <Search size={14} className="topbar-search-icon" />
          <span className="topbar-search-placeholder">페이지, 회원, 기능 검색...</span>
          <span className="topbar-search-kbd">⌘K</span>
        </button>
      </div>

      <div className="topbar-right">
        <div className="topbar-status">
          <span className="topbar-status-dot topbar-status-dot--active" />
          <span className="topbar-status-label">시스템 정상</span>
        </div>

        <button
          className="topbar-theme-btn"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
          title={theme === 'dark' ? '라이트 모드' : '다크 모드'}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <div className="topbar-profile-wrap">
          <button
            className="topbar-profile-btn"
            onClick={() => setProfileOpen(v => !v)}
          >
            <div className="topbar-avatar">{initials}</div>
            <span className="topbar-username">{user?.name}</span>
            <ChevronDown size={13} className={`topbar-chevron ${profileOpen ? 'open' : ''}`} />
          </button>

          {profileOpen && (
            <>
              <div className="topbar-dropdown-backdrop" onClick={() => setProfileOpen(false)} />
              <div className="topbar-dropdown">
                <div className="topbar-dropdown-header">
                  <div className="topbar-dropdown-avatar">{initials}</div>
                  <div>
                    <div className="topbar-dropdown-name">{user?.name}</div>
                    <div className="topbar-dropdown-role">{user?.authority}</div>
                  </div>
                </div>
                <div className="topbar-dropdown-divider" />
                <button className="topbar-dropdown-item topbar-dropdown-item--danger" onClick={handleLogout}>
                  <LogOut size={13} />
                  로그아웃
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminTopbar;

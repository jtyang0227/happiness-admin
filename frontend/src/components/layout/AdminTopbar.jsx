import React, { useState, useCallback } from 'react';
import { Menu, Search, ChevronDown, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminTopbar.css';

const AdminTopbar = ({ onMenuClick, sidebarCollapsed }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

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
        <div className="topbar-search">
          <Search size={14} className="topbar-search-icon" />
          <input
            type="text"
            className="topbar-search-input"
            placeholder="페이지, 회원, 기능 검색..."
            readOnly
          />
          <span className="topbar-search-kbd">⌘K</span>
        </div>
      </div>

      <div className="topbar-right">
        <div className="topbar-status">
          <span className="topbar-status-dot topbar-status-dot--active" />
          <span className="topbar-status-label">시스템 정상</span>
        </div>

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

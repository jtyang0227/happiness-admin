import React, { useState, useEffect, useCallback } from 'react';
import { Search, ChevronDown, LogOut, Sun, Moon } from 'lucide-react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getApi } from '../../utils/api';
import logo from '../../assets/logo.png';
import { NAV_GROUPS, findActiveGroup } from './navConfig';
import './AdminTopbar.css';

const STATUS_CHECK_INTERVAL = 60000;

const getStoredTheme = () => localStorage.getItem('theme') || 'light';

const applyTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
};

const AdminTopbar = ({ onSearchClick }) => {
  const { pathname } = useLocation();
  const activeGroup = findActiveGroup(pathname);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileClosing, setProfileClosing] = useState(false);
  const [theme, setTheme] = useState(getStoredTheme);
  const [systemStatus, setSystemStatus] = useState('checking');

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    let cancelled = false;
    const checkStatus = () => {
      getApi('/admin/system/status')
        .then(() => { if (!cancelled) setSystemStatus('active'); })
        .catch(() => { if (!cancelled) setSystemStatus('error'); });
    };
    checkStatus();
    const timer = setInterval(checkStatus, STATUS_CHECK_INTERVAL);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const openProfile = useCallback(() => {
    setProfileClosing(false);
    setProfileOpen(true);
  }, []);

  const closeProfile = useCallback(() => {
    setProfileClosing(true);
  }, []);

  const handleDropdownAnimationEnd = useCallback(() => {
    if (profileClosing) {
      setProfileOpen(false);
      setProfileClosing(false);
    }
  }, [profileClosing]);

  const initials = user?.name ? user.name.slice(0, 2) : 'AD';

  return (
    <header className="admin-topbar">
      <div className="topbar-left">
        <span className="topbar-logo">
          <img src={logo} alt="hapis" className="topbar-logo-img" />
        </span>
      </div>

      <nav className="topbar-tabs" aria-label="주요 메뉴">
        {NAV_GROUPS.map(g => (
          <NavLink
            key={g.key}
            to={g.home}
            className={`topbar-tab${activeGroup?.key === g.key ? ' active' : ''}`}
            aria-current={activeGroup?.key === g.key ? 'page' : undefined}
          >
            {g.label}
          </NavLink>
        ))}
      </nav>

      <div className="topbar-right">
        <button className="topbar-search-btn" onClick={onSearchClick} type="button" aria-label="검색 (⌘K)" title="검색 (⌘K)">
          <Search size={16} />
        </button>

        <button className="topbar-status" onClick={() => navigate('/system')} type="button">
          <span className={`topbar-status-dot topbar-status-dot--${systemStatus}`} />
          <span className="topbar-status-label">
            {systemStatus === 'active' ? '시스템 정상' : systemStatus === 'error' ? '시스템 오류' : '확인 중'}
          </span>
        </button>

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
            onClick={() => (profileOpen && !profileClosing ? closeProfile() : openProfile())}
          >
            <div className="topbar-avatar">{initials}</div>
            <span className="topbar-username">{user?.name}</span>
            <ChevronDown size={13} className={`topbar-chevron ${profileOpen && !profileClosing ? 'open' : ''}`} />
          </button>

          {profileOpen && (
            <>
              <div className={`topbar-dropdown-backdrop ${profileClosing ? 'closing' : ''}`} onClick={closeProfile} />
              <div
                className={`topbar-dropdown ${profileClosing ? 'closing' : ''}`}
                onAnimationEnd={handleDropdownAnimationEnd}
              >
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

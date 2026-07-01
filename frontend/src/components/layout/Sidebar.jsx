import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Image, MessageSquare,
  BookOpen, BarChart2, Settings,
  Sparkles, FolderOpen, Bell, Flag, ShieldCheck, LayoutPanelTop,
  GripVertical, Star, SlidersHorizontal, ArrowUpDown, ChevronDown, AppWindow,
} from 'lucide-react';
import './Sidebar.css';

const SORT_ITEMS = [
  { path: '/sort/photos',  label: '사진 정렬' },
  { path: '/sort/series',  label: '시리즈 정렬' },
];

const NAV_ITEMS = [
  { path: '/',               label: '대시보드',    Icon: LayoutDashboard },
  { path: '/members',        label: '회원 관리',   Icon: Users },
  { path: '/photos',         label: '사진 관리',   Icon: Image },
  { path: '/portfolios',     label: '포트폴리오',  Icon: FolderOpen },
  { path: '/series',         label: '시리즈',      Icon: BookOpen },
  { path: '/inquiries',      label: '문의 관리',   Icon: MessageSquare },
  { path: '/stats',          label: '통계',        Icon: BarChart2 },
  { path: '/reports',        label: '신고 관리',   Icon: Flag },
  { path: '/notices',        label: '공지사항',    Icon: Bell },
  { path: '/banners',        label: '배너 관리',   Icon: LayoutPanelTop },
  { path: '/popups',         label: '팝업 관리',   Icon: AppWindow },
  { path: '/verifications',  label: '작가 인증',   Icon: ShieldCheck },
  { path: '/gallery-order',  label: '갤러리 순서', Icon: GripVertical },
  { path: '/featured',       label: '피처드',      Icon: Star },
  { path: '/content-policy', label: '콘텐츠 정책', Icon: SlidersHorizontal },
  { path: '/system',         label: '시스템 설정', Icon: Settings },
];

const Sidebar = ({ collapsed = false, className = '' }) => {
  const location = useLocation();
  const [sortOpen, setSortOpen] = useState(() => location.pathname.startsWith('/sort'));

  useEffect(() => {
    if (location.pathname.startsWith('/sort')) setSortOpen(true);
  }, [location.pathname]);

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''} ${className}`}>
      <div className="sidebar-brand">
        <Sparkles size={16} className="sidebar-brand-icon" />
        {!collapsed && <span className="sidebar-brand-text">Happiness</span>}
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ path, label, Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            title={collapsed ? label : undefined}
          >
            <span className="sidebar-icon"><Icon size={16} strokeWidth={1.75} /></span>
            {!collapsed && <span className="sidebar-label">{label}</span>}
          </NavLink>
        ))}

        <div className={`sidebar-group${sortOpen ? ' open' : ''}`}>
          <button
            className={`sidebar-link sidebar-group-trigger${location.pathname.startsWith('/sort') ? ' active' : ''}`}
            onClick={() => setSortOpen(v => !v)}
            title={collapsed ? '정렬 관리' : undefined}
          >
            <span className="sidebar-icon"><ArrowUpDown size={16} strokeWidth={1.75} /></span>
            {!collapsed && (
              <>
                <span className="sidebar-label">정렬 관리</span>
                <ChevronDown size={12} className="sidebar-chevron" />
              </>
            )}
          </button>
          {!collapsed && (
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
          )}
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;

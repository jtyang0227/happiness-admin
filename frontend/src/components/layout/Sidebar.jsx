import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Image, MessageSquare,
  BookOpen, BarChart2, Settings,
  FolderOpen, Bell, Flag, ShieldCheck, LayoutPanelTop,
  Star, SlidersHorizontal, ArrowUpDown, ChevronDown, AppWindow,
  CalendarDays,
} from 'lucide-react';
import logo from '../../assets/logo.png';
import './Sidebar.css';

const SORT_ITEMS = [
  { path: '/sort/photos',  label: '사진 정렬' },
  { path: '/sort/series',  label: '시리즈 정렬' },
];

const NAV_GROUPS = [
  {
    label: null,
    items: [
      { path: '/', label: '대시보드', Icon: LayoutDashboard },
    ],
  },
  {
    label: '콘텐츠',
    items: [
      { path: '/photos',         label: '사진 관리',   Icon: Image },
      { path: '/portfolios',     label: '포트폴리오',  Icon: FolderOpen },
      { path: '/series',         label: '시리즈',      Icon: BookOpen },
      { type: 'accordion', key: 'sort', label: '정렬 관리', Icon: ArrowUpDown, subItems: SORT_ITEMS },
      { path: '/reports',        label: '신고 관리',   Icon: Flag },
      { path: '/featured',       label: '피처드',      Icon: Star },
      { path: '/content-policy', label: '콘텐츠 정책', Icon: SlidersHorizontal },
    ],
  },
  {
    label: '회원',
    items: [
      { path: '/members',       label: '회원 관리', Icon: Users },
      { path: '/verifications', label: '작가 인증', Icon: ShieldCheck },
    ],
  },
  {
    label: '운영·마케팅',
    items: [
      { path: '/inquiries', label: '문의 관리', Icon: MessageSquare },
      { path: '/bookings',  label: '예약 관리', Icon: CalendarDays },
      { path: '/stats',     label: '통계',      Icon: BarChart2 },
      { path: '/notices',   label: '공지사항',  Icon: Bell },
      { path: '/banners',   label: '배너 관리', Icon: LayoutPanelTop },
      { path: '/popups',    label: '팝업 관리', Icon: AppWindow },
    ],
  },
  {
    label: '설정',
    items: [
      { path: '/system', label: '시스템 설정', Icon: Settings },
    ],
  },
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
        <img src={logo} alt="hapis" className={`sidebar-brand-logo ${collapsed ? 'sidebar-brand-logo--collapsed' : ''}`} />
      </div>

      <nav className="sidebar-nav">
        {NAV_GROUPS.map((group, gi) => (
          <div className="sidebar-group-section" key={group.label || `top-${gi}`}>
            {group.label && (
              collapsed
                ? <div className="sidebar-divider" />
                : <div className="sidebar-group-title">{group.label}</div>
            )}
            {group.items.map(item => {
              if (item.type === 'accordion') {
                const { key, label, Icon, subItems } = item;
                return (
                  <div className={`sidebar-group${sortOpen ? ' open' : ''}`} key={key}>
                    <button
                      className={`sidebar-link sidebar-group-trigger${location.pathname.startsWith('/sort') ? ' active' : ''}`}
                      onClick={() => setSortOpen(v => !v)}
                      title={collapsed ? label : undefined}
                    >
                      <span className="sidebar-icon"><Icon size={16} strokeWidth={1.75} /></span>
                      {!collapsed && (
                        <>
                          <span className="sidebar-label">{label}</span>
                          <ChevronDown size={12} className="sidebar-chevron" />
                        </>
                      )}
                    </button>
                    {!collapsed && (
                      <div className="sidebar-sub">
                        {subItems.map(({ path, label: subLabel }) => (
                          <NavLink
                            key={path}
                            to={path}
                            className={({ isActive }) => `sidebar-sub-link${isActive ? ' active' : ''}`}
                          >
                            {subLabel}
                          </NavLink>
                        ))}
                        <p className="sidebar-sub-hint">시리즈별·포트폴리오별 아이템 정렬은 각 목록에서 진입하세요.</p>
                      </div>
                    )}
                  </div>
                );
              }
              const { path, label, Icon } = item;
              return (
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
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Image, MessageSquare, BookOpen,
  BarChart2, Settings, FolderOpen, Bell, Flag, ShieldCheck,
  LayoutPanelTop, AppWindow, Star, SlidersHorizontal,
  GripVertical, ArrowUpDown, Search, X,
} from 'lucide-react';
import './CommandPalette.css';

const COMMANDS = [
  { path: '/',               label: '대시보드',    Icon: LayoutDashboard,   group: '페이지' },
  { path: '/members',        label: '회원 관리',   Icon: Users,             group: '페이지' },
  { path: '/photos',         label: '사진 관리',   Icon: Image,             group: '페이지' },
  { path: '/portfolios',     label: '포트폴리오',  Icon: FolderOpen,        group: '페이지' },
  { path: '/series',         label: '시리즈',      Icon: BookOpen,          group: '페이지' },
  { path: '/inquiries',      label: '문의 관리',   Icon: MessageSquare,     group: '페이지' },
  { path: '/stats',          label: '통계',        Icon: BarChart2,         group: '페이지' },
  { path: '/reports',        label: '신고 관리',   Icon: Flag,              group: '페이지' },
  { path: '/notices',        label: '공지사항',    Icon: Bell,              group: '페이지' },
  { path: '/banners',        label: '배너 관리',   Icon: LayoutPanelTop,    group: '페이지' },
  { path: '/popups',         label: '팝업 관리',   Icon: AppWindow,         group: '페이지' },
  { path: '/verifications',  label: '작가 인증',   Icon: ShieldCheck,       group: '페이지' },
  { path: '/gallery-order',  label: '갤러리 순서', Icon: GripVertical,      group: '페이지' },
  { path: '/featured',       label: '피처드',      Icon: Star,              group: '페이지' },
  { path: '/content-policy', label: '콘텐츠 정책', Icon: SlidersHorizontal, group: '페이지' },
  { path: '/system',         label: '시스템 설정', Icon: Settings,          group: '페이지' },
  { path: '/sort/photos',    label: '사진 정렬',   Icon: ArrowUpDown,       group: '정렬' },
  { path: '/sort/series',    label: '시리즈 정렬', Icon: ArrowUpDown,       group: '정렬' },
];

const CommandPalette = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const filtered = query
    ? COMMANDS.filter(c => c.label.includes(query) || c.path.includes(query))
    : COMMANDS;

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  useEffect(() => { setActiveIdx(0); }, [query]);

  const handleSelect = useCallback((path) => {
    navigate(path);
    onClose();
  }, [navigate, onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx(i => Math.min(i + 1, filtered.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx(i => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter' && filtered[activeIdx]) {
        handleSelect(filtered[activeIdx].path);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, filtered, activeIdx, handleSelect, onClose]);

  if (!open) return null;

  const groups = [...new Set(filtered.map(c => c.group))];

  return (
    <div className="cmd-overlay" onMouseDown={onClose}>
      <div className="cmd-dialog" onMouseDown={e => e.stopPropagation()}>
        <div className="cmd-input-wrap">
          <Search size={15} className="cmd-search-icon" />
          <input
            ref={inputRef}
            className="cmd-input"
            placeholder="페이지 이름으로 검색..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button className="cmd-close-btn" onClick={onClose} tabIndex={-1}>
            <X size={14} />
          </button>
        </div>

        <div className="cmd-list">
          {filtered.length === 0 ? (
            <div className="cmd-empty">검색 결과가 없습니다</div>
          ) : (
            groups.map(group => {
              const items = filtered.filter(c => c.group === group);
              return (
                <div key={group} className="cmd-group">
                  <div className="cmd-group-label">{group}</div>
                  {items.map(cmd => {
                    const globalIdx = filtered.indexOf(cmd);
                    return (
                      <button
                        key={cmd.path}
                        className={`cmd-item ${globalIdx === activeIdx ? 'cmd-item--active' : ''}`}
                        onClick={() => handleSelect(cmd.path)}
                        onMouseEnter={() => setActiveIdx(globalIdx)}
                      >
                        <span className="cmd-item-icon"><cmd.Icon size={14} /></span>
                        <span className="cmd-item-label">{cmd.label}</span>
                        <span className="cmd-item-path">{cmd.path}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        <div className="cmd-footer">
          <span><kbd>↑↓</kbd> 이동</span>
          <span><kbd>Enter</kbd> 선택</span>
          <span><kbd>Esc</kbd> 닫기</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;

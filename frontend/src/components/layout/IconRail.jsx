import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { findActiveGroup } from './navConfig';
import './IconRail.css';

const IconRail = () => {
  const { pathname } = useLocation();
  const [sortOpen, setSortOpen] = useState(false);
  const group = findActiveGroup(pathname);

  useEffect(() => { setSortOpen(false); }, [pathname]);

  if (!group || group.items.length === 0) return null;

  return (
    <nav className="icon-rail" aria-label={`${group.label} 메뉴`}>
      {group.items.map(item => {
        const { label, Icon } = item;
        if (item.type === 'sort') {
          const active = pathname.startsWith('/sort');
          return (
            <div className="icon-rail-item-wrap" key="sort">
              <button
                type="button"
                className={`icon-rail-item${active ? ' active' : ''}`}
                aria-label={label}
                aria-expanded={sortOpen}
                onClick={() => setSortOpen(v => !v)}
              >
                <Icon size={18} strokeWidth={1.75} />
                <span className="icon-rail-tip">{label}</span>
              </button>
              {sortOpen && (
                <div className="icon-rail-popover">
                  {item.subItems.map(sub => (
                    <NavLink
                      key={sub.path}
                      to={sub.path}
                      className={({ isActive }) => `icon-rail-popover-link${isActive ? ' active' : ''}`}
                    >
                      {sub.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        }
        const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={`icon-rail-item${isActive ? ' active' : ''}`}
            aria-label={label}
          >
            <Icon size={18} strokeWidth={1.75} />
            <span className="icon-rail-tip">{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export default IconRail;

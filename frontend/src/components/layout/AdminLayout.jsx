import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import AdminTopbar from './AdminTopbar';
import IconRail from './IconRail';
import { findActiveGroup } from './navConfig';
import CommandPalette from '../common/CommandPalette';
import './AdminLayout.css';

const AdminLayout = ({ children }) => {
  const { pathname } = useLocation();
  const [cmdOpen, setCmdOpen] = useState(false);
  const group = findActiveGroup(pathname);
  const hasRail = !!group && group.items.length > 0;

  const openCmd = useCallback(() => setCmdOpen(true), []);
  const closeCmd = useCallback(() => setCmdOpen(false), []);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(v => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="admin-layout">
      <AdminTopbar onSearchClick={openCmd} />
      <IconRail />

      <main className={`admin-main${hasRail ? ' admin-main--rail' : ''}`}>
        {children}
      </main>

      <CommandPalette open={cmdOpen} onClose={closeCmd} />
    </div>
  );
};

export default AdminLayout;

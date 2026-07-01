import React, { useState, useEffect, useCallback } from 'react';
import AdminTopbar from './AdminTopbar';
import Sidebar from './Sidebar';
import CommandPalette from '../common/CommandPalette';
import './AdminLayout.css';

const AdminLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const isMobile = () => window.innerWidth <= 767;

  const handleMenuClick = () => {
    if (isMobile()) {
      setMobileOpen(v => !v);
    } else {
      setCollapsed(v => !v);
    }
  };

  const openCmd = useCallback(() => setCmdOpen(true), []);
  const closeCmd = useCallback(() => setCmdOpen(false), []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

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
      <AdminTopbar
        onMenuClick={handleMenuClick}
        sidebarCollapsed={collapsed}
        onSearchClick={openCmd}
      />

      <Sidebar
        collapsed={collapsed}
        className={mobileOpen ? 'sidebar--mobile-open' : ''}
      />

      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      <main
        className="admin-main"
        style={{ marginLeft: collapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width-expanded)' }}
      >
        {children}
      </main>

      <CommandPalette open={cmdOpen} onClose={closeCmd} />
    </div>
  );
};

export default AdminLayout;

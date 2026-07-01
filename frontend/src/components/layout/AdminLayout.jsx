import React, { useState, useEffect } from 'react';
import AdminTopbar from './AdminTopbar';
import Sidebar from './Sidebar';
import './AdminLayout.css';

const AdminLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = () => window.innerWidth <= 767;

  const handleMenuClick = () => {
    if (isMobile()) {
      setMobileOpen(v => !v);
    } else {
      setCollapsed(v => !v);
    }
  };

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <div className="admin-layout">
      <AdminTopbar onMenuClick={handleMenuClick} sidebarCollapsed={collapsed} />

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
    </div>
  );
};

export default AdminLayout;

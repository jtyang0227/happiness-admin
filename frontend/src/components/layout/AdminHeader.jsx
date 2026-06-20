import React from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './AdminHeader.css';

const AdminHeader = ({ onMenuClick }) => {
  const { user } = useAuth();
  return (
    <header className="admin-header">
      <button className="header-menu-btn" onClick={onMenuClick} aria-label="메뉴 열기">
        <Menu size={20} />
      </button>
      <span className="header-brand">Happiness Admin</span>
      <span className="header-user">{user?.name}</span>
    </header>
  );
};

export default AdminHeader;

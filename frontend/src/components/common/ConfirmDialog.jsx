import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2 } from 'lucide-react';
import './ConfirmDialog.css';

const ConfirmDialog = ({ open, title, description, variant = 'danger', onConfirm, onCancel }) => {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, onCancel]);

  if (!open) return null;

  const Icon = variant === 'danger' ? Trash2 : AlertTriangle;

  return createPortal(
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className={`confirm-icon ${variant}`}>
          <Icon size={20} strokeWidth={2} />
        </div>
        <p className="confirm-title">{title}</p>
        <p className="confirm-description">{description}</p>
        <div className="confirm-actions">
          <button className="confirm-btn-cancel" onClick={onCancel}>취소</button>
          <button className={`confirm-btn-confirm ${variant}`} onClick={onConfirm}>확인</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmDialog;

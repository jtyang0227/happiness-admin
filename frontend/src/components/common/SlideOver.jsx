import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import './SlideOver.css';

const SlideOver = ({ open, onClose, title, children, footer, width = 480 }) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="slideover-backdrop" onClick={onClose} aria-hidden="true" />
      <aside
        className="slideover"
        style={{ width: Math.min(width, window.innerWidth) }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="slideover-header">
          <h2 className="slideover-title">{title}</h2>
          <button className="btn btn-icon slideover-close" onClick={onClose} aria-label="닫기">
            <X size={16} />
          </button>
        </div>
        <div className="slideover-body">{children}</div>
        {footer && <div className="slideover-footer">{footer}</div>}
      </aside>
    </>
  );
};

export default SlideOver;

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import './SlideOver.css';

const SlideOver = ({ open, onClose, title, children, footer, width = 480 }) => {
  const [rendered, setRendered] = useState(open);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setRendered(true);
      setClosing(false);
    } else {
      setClosing(true);
    }
  }, [open]);

  const handleAnimationEnd = () => {
    if (closing) {
      setRendered(false);
      setClosing(false);
    }
  };

  useEffect(() => {
    if (rendered) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [rendered]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    if (rendered) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [rendered, onClose]);

  if (!rendered) return null;

  return (
    <>
      <div className={`slideover-backdrop ${closing ? 'closing' : ''}`} onClick={onClose} aria-hidden="true" />
      <aside
        className={`slideover ${closing ? 'closing' : ''}`}
        style={{ width: Math.min(width, window.innerWidth) }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onAnimationEnd={handleAnimationEnd}
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

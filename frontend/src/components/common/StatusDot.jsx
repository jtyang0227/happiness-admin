import React from 'react';
import './StatusDot.css';

const StatusDot = ({ status = 'idle', label, size = 'md' }) => (
  <span className={`status-dot-wrap status-dot-wrap--${size}`}>
    <span className={`status-dot status-dot--${status}`} />
    {label && <span className="status-dot-label">{label}</span>}
  </span>
);

export default StatusDot;

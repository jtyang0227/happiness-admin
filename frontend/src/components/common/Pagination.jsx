import React from 'react';
import './Pagination.css';

const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    const half = 3;
    let start = Math.max(0, Math.min(page - half, totalPages - 7));
    return start + i;
  });
  return (
    <div className="pagination">
      <button className="page-btn" disabled={page === 0} onClick={() => onPageChange(page - 1)}>‹</button>
      {pages.map(p => (
        <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => onPageChange(p)}>{p + 1}</button>
      ))}
      <button className="page-btn" disabled={page >= totalPages - 1} onClick={() => onPageChange(page + 1)}>›</button>
    </div>
  );
};

export default Pagination;

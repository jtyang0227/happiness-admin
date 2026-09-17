import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getApi } from '../utils/api';
import Pagination from '../components/common/Pagination';
import SlideOver from '../components/common/SlideOver';

const STATUS_LABELS = { REQUESTED: '대기중', CONFIRMED: '확정', REJECTED: '거절', CANCELLED: '취소' };
const STATUS_BADGES = { REQUESTED: 'badge-yellow', CONFIRMED: 'badge-green', REJECTED: 'badge-red', CANCELLED: 'badge-draft' };

const BookingListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  const date = searchParams.get('date') || '';
  const status = searchParams.get('status') || '';
  const page = parseInt(searchParams.get('page') || '0', 10);

  const updateParams = useCallback((updates) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([k, v]) => {
        if (v === '' || v === null || v === undefined) next.delete(k);
        else next.set(k, String(v));
      });
      return next;
    });
  }, [setSearchParams]);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, size: 20 });
    if (date) params.set('date', date);
    if (status) params.set('status', status);
    getApi(`/admin/bookings?${params}`).then(setData).finally(() => setLoading(false));
  }, [page, date, status]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="list-page">
      <div className="page-header">
        <h1 className="page-title">예약 관리</h1>
        <span className="total-count">총 {data.totalElements?.toLocaleString()}건</span>
      </div>

      <div className="filter-bar">
        <input
          type="date"
          className="filter-select"
          value={date}
          onChange={e => updateParams({ date: e.target.value, page: '' })}
        />
        <select className="filter-select" value={status} onChange={e => updateParams({ status: e.target.value, page: '' })}>
          <option value="">전체 상태</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        {(date || status) && (
          <button className="btn btn-ghost btn-sm" onClick={() => setSearchParams({})}>초기화</button>
        )}
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>신청자</th><th>촬영작가</th><th>촬영 종류</th><th>희망일</th>
              <th>장소</th><th>예산</th><th>접수일</th><th>상태</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="loading-cell">로딩 중...</td></tr>
            ) : data.content.length === 0 ? (
              <tr><td colSpan="8" className="loading-cell">등록된 예약이 없습니다.</td></tr>
            ) : data.content.map(b => (
              <tr key={b.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(b)}>
                <td className="name-cell">{b.clientName || '-'}</td>
                <td>{b.photographerName}<br /><small>@{b.photographerProfileName}</small></td>
                <td>{b.shootType || '-'}</td>
                <td>{b.shootDate || '-'}</td>
                <td>{b.shootLocation || '-'}</td>
                <td>{b.budget || '-'}</td>
                <td>{b.createdAt?.slice(0, 10)}</td>
                <td><span className={`badge ${STATUS_BADGES[b.status] || 'badge-draft'}`}>{STATUS_LABELS[b.status] || b.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={data.totalPages} onPageChange={p => updateParams({ page: p === 0 ? '' : p })} />

      <SlideOver open={!!selected} onClose={() => setSelected(null)} title="예약 상세">
        {selected && (
          <>
            <div className="so-field"><span className="so-label">신청자</span><span className="so-value">{selected.clientName || '-'}</span></div>
            <div className="so-field"><span className="so-label">촬영작가</span><span className="so-value">{selected.photographerName} (@{selected.photographerProfileName})</span></div>
            <div className="so-field"><span className="so-label">촬영 종류</span><span className="so-value">{selected.shootType || '-'}</span></div>
            <div className="so-field"><span className="so-label">희망일</span><span className="so-value">{selected.shootDate || '-'}</span></div>
            <div className="so-field"><span className="so-label">장소</span><span className="so-value">{selected.shootLocation || '-'}</span></div>
            <div className="so-field"><span className="so-label">예산</span><span className="so-value">{selected.budget || '-'}</span></div>
            <div className="so-field"><span className="so-label">상태</span><span className="so-value">{STATUS_LABELS[selected.status] || selected.status}</span></div>
            {selected.message && (
              <div className="so-field"><span className="so-label">요청 메시지</span><span className="so-value">{selected.message}</span></div>
            )}
            {selected.rejectedReason && (
              <div className="so-field"><span className="so-label">거절 사유</span><span className="so-value">{selected.rejectedReason}</span></div>
            )}
            <hr className="so-divider" />
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
              상태 변경 기능은 추후 지원 예정입니다.
            </p>
          </>
        )}
      </SlideOver>
    </div>
  );
};

export default BookingListPage;

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { getApi } from '../../utils/api';
import './WeeklyBookingList.css';

const STATUS_MAP = {
  CONFIRMED: { label: '확정', cls: 'wbl-status-confirmed' },
  REQUESTED: { label: '대기', cls: 'wbl-status-requested' },
  REJECTED:  { label: '거절', cls: 'wbl-status-rejected'  },
  CANCELLED: { label: '취소', cls: 'wbl-status-cancelled' },
};

const WEEK_DAYS = ['일', '월', '화', '수', '목', '금', '토'];

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, '0')}(${WEEK_DAYS[d.getDay()]})`;
};

const WeeklyBookingList = () => {
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    getApi('/admin/bookings/this-week')
      .then(data => setBookings(data.slice(0, 10)))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="dashboard-card full-width">
      <div className="card-header">
        <h2 className="card-title">이번 주 촬영 예약</h2>
        <Link to="/bookings" className="card-link">
          전체 보기 <ArrowUpRight size={12} />
        </Link>
      </div>

      {loading ? (
        <div className="loading-cell">로딩 중...</div>
      ) : bookings.length === 0 ? (
        <div className="wbl-empty">이번 주 예정된 촬영이 없습니다. ☀️</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>촬영일</th>
              <th>작가</th>
              <th>클라이언트</th>
              <th>촬영 종류</th>
              <th>장소</th>
              <th>예산</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(b => {
              const st = STATUS_MAP[b.status] || { label: b.status, cls: '' };
              return (
                <tr key={b.id}>
                  <td className="wbl-date">{formatDate(b.shootDate)}</td>
                  <td>
                    {b.photographerName || '-'}
                    {b.photographerProfileName && (
                      <><br /><small style={{ color: 'var(--color-text-tertiary)' }}>{b.photographerProfileName}</small></>
                    )}
                  </td>
                  <td>{b.clientName || '-'}</td>
                  <td>{b.shootType || '-'}</td>
                  <td className="wbl-location">{b.shootLocation || '-'}</td>
                  <td>{b.budget || '-'}</td>
                  <td>
                    <span className={`badge ${st.cls}`}>{st.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default WeeklyBookingList;

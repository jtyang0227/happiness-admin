import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X, ArrowUpRight } from 'lucide-react';
import { getApi } from '../../utils/api';
import './BookingCalendar.css';

const STATUS_MAP = {
  CONFIRMED: { label: '확정',  cls: 'booking-status-confirmed' },
  REQUESTED: { label: '대기',  cls: 'booking-status-requested' },
  REJECTED:  { label: '거절',  cls: 'booking-status-rejected'  },
  CANCELLED: { label: '취소',  cls: 'booking-status-cancelled' },
};

const getDotColor = (count) => {
  if (count >= 6) return 'var(--color-brand)';
  if (count >= 3) return 'var(--color-warning, #f59e0b)';
  return 'var(--color-info, #0ea5e9)';
};

const pad = (n) => String(n).padStart(2, '0');
const toDateStr = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

const buildCalDays = (year, month) => {
  const firstDay = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate();
  const prevDays = new Date(year, month - 1, 0).getDate();
  // Start week on Monday: Sunday(0) → offset 6, Mon(1) → 0, ...
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  const days = [];
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = prevDays - i;
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear  = month === 1 ? year - 1 : year;
    days.push({ day: d, dateStr: toDateStr(prevYear, prevMonth, d), isCurrentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ day: d, dateStr: toDateStr(year, month, d), isCurrentMonth: true });
  }
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    const nextMonth = month === 12 ? 1  : month + 1;
    const nextYear  = month === 12 ? year + 1 : year;
    days.push({ day: d, dateStr: toDateStr(nextYear, nextMonth, d), isCurrentMonth: false });
  }
  return days;
};

const BookingCalendar = () => {
  const today = new Date();
  const todayStr = toDateStr(today.getFullYear(), today.getMonth() + 1, today.getDate());

  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [dots,  setDots]  = useState({});
  const [selected,     setSelected]     = useState(null);
  const [sideBookings, setSideBookings] = useState([]);
  const [sideLoading,  setSideLoading]  = useState(false);

  const loadDots = useCallback(() => {
    getApi(`/admin/bookings/calendar?year=${year}&month=${month}`)
      .then(data => {
        const map = {};
        data.forEach(d => { map[d.date] = d.count; });
        setDots(map);
      })
      .catch(() => {});
  }, [year, month]);

  useEffect(() => { loadDots(); }, [loadDots]);

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
    setSelected(null);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
    setSelected(null);
  };

  const handleDayClick = (dateStr, isCurrentMonth) => {
    if (!isCurrentMonth) return;
    if (selected === dateStr) { setSelected(null); return; }
    setSelected(dateStr);
    setSideLoading(true);
    getApi(`/admin/bookings/by-date?date=${dateStr}`)
      .then(data => setSideBookings(data))
      .catch(() => setSideBookings([]))
      .finally(() => setSideLoading(false));
  };

  const calDays = buildCalDays(year, month);

  return (
    <div className="dashboard-card booking-calendar-card">
      <div className="card-header">
        <h2 className="card-title">촬영 예약 캘린더</h2>
        <div className="cal-nav">
          <button className="cal-nav-btn" onClick={prevMonth}><ChevronLeft size={14} /></button>
          <span className="cal-nav-label">{year}년 {month}월</span>
          <button className="cal-nav-btn" onClick={nextMonth}><ChevronRight size={14} /></button>
        </div>
      </div>

      <div className="cal-body">
        <div className="cal-grid">
          {['월','화','수','목','금','토','일'].map(d => (
            <div key={d} className="cal-weekday">{d}</div>
          ))}
          {calDays.map(({ day, dateStr, isCurrentMonth }) => (
            <div
              key={dateStr}
              className={[
                'cal-day',
                !isCurrentMonth ? 'cal-day--other' : '',
                dateStr === todayStr ? 'cal-day--today' : '',
                selected === dateStr ? 'cal-day--selected' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => handleDayClick(dateStr, isCurrentMonth)}
            >
              <span className="cal-day-num">{day}</span>
              {dots[dateStr] && isCurrentMonth && (
                <span className="cal-dot" style={{ background: getDotColor(dots[dateStr]) }} />
              )}
            </div>
          ))}
        </div>

        {selected && (
          <div className="booking-day-panel">
            <div className="booking-day-panel-header">
              <span className="booking-day-panel-title">
                {selected.slice(5).replace('-', '월 ')}일 예약
                {sideBookings.length > 0 && ` (${sideBookings.length}건)`}
              </span>
              <button className="booking-day-panel-close" onClick={() => setSelected(null)}>
                <X size={14} />
              </button>
            </div>
            <div className="booking-day-panel-body">
              {sideLoading ? (
                <div className="booking-day-empty">로딩 중...</div>
              ) : sideBookings.length === 0 ? (
                <div className="booking-day-empty">해당 날짜에 예약이 없습니다.</div>
              ) : (
                sideBookings.map(b => {
                  const st = STATUS_MAP[b.status] || { label: b.status, cls: '' };
                  return (
                    <div key={b.id} className="booking-day-item">
                      <div className="booking-day-item-top">
                        <span className={`booking-status-badge ${st.cls}`}>{st.label}</span>
                        <span className="booking-day-type">{b.shootType}</span>
                      </div>
                      <div className="booking-day-info">
                        <span className="booking-day-label">작가</span>
                        <span>{b.photographerName || '-'}</span>
                      </div>
                      <div className="booking-day-info">
                        <span className="booking-day-label">클라이언트</span>
                        <span>{b.clientName || '-'}</span>
                      </div>
                      {b.budget && (
                        <div className="booking-day-info">
                          <span className="booking-day-label">예산</span>
                          <span>{b.budget}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            <Link to={`/bookings?date=${selected}`} className="booking-day-panel-footer">
              예약 관리에서 보기 <ArrowUpRight size={12} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingCalendar;

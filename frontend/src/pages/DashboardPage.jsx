import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getApi } from '../utils/api';
import ImgWithFallback from '../components/common/ImgWithFallback';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import BookingCalendar from '../components/dashboard/BookingCalendar';
import WeeklyBookingList from '../components/dashboard/WeeklyBookingList';
import './DashboardPage.css';

const ChangeIndicator = ({ change }) => {
  if (change == null) return null;
  if (change > 0)  return <span className="kpi-change kpi-change--up"><TrendingUp size={10} />{change}%</span>;
  if (change < 0)  return <span className="kpi-change kpi-change--down"><TrendingDown size={10} />{Math.abs(change)}%</span>;
  return <span className="kpi-change kpi-change--neutral"><Minus size={10} />0%</span>;
};

const KpiCard = ({ icon, label, value, color, to, progress, change }) => (
  <Link to={to} className="dash-kpi-card" style={{ '--kpi-color': color }}>
    <div className="dash-kpi-card-top">
      <div className="dash-kpi-icon" style={{ background: color + '1A', color }}>{icon}</div>
      <ChangeIndicator change={change} />
    </div>
    <div className="dash-kpi-value">{value?.toLocaleString() ?? '-'}</div>
    <div className="dash-kpi-label">{label}</div>
    {progress != null && (
      <div className="kpi-progress-track">
        <div className="kpi-progress-bar" style={{ width: `${Math.min(progress, 100)}%`, background: color }} />
      </div>
    )}
    <ArrowUpRight size={13} className="kpi-arrow" />
  </Link>
);

const DashboardPage = () => {
  const [summary, setSummary] = useState(null);
  const [daily, setDaily] = useState([]);
  const [topPhotos, setTopPhotos] = useState([]);
  const [recentInquiries, setRecentInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getApi('/admin/stats/summary'),
      getApi('/admin/stats/daily?days=7'),
      getApi('/admin/stats/top-photos?sortBy=likes'),
      getApi('/admin/inquiries?page=0&size=5'),
    ]).then(([sum, dl, photos, inqs]) => {
      setSummary(sum);
      setDaily(dl);
      setTopPhotos(photos.slice(0, 5));
      setRecentInquiries(inqs.content || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading">로딩 중...</div>;

  return (
    <div className="dashboard-page">
      <h1 className="page-title">대시보드</h1>

      <div className="kpi-grid">
        <KpiCard icon="👥" label="전체 회원"     value={summary?.totalMembers}    color="#C7361B" to="/members" />
        <KpiCard icon="📷" label="전체 사진"     value={summary?.totalPhotos}     color="#3F8A57" to="/photos" />
        <KpiCard icon="📬" label="오늘 신규 문의" value={summary?.todayInquiries}  color="#B8791E" to="/inquiries" />
        <KpiCard icon="🔔" label="미읽음 문의"   value={summary?.unreadInquiries} color="#A82530" to="/inquiries" />
        <KpiCard icon="📅" label="오늘 예약"     value={summary?.todayBookings}   color="#2F7A8C" to="/bookings" />
        <KpiCard icon="⏳" label="미확정 예약"   value={summary?.pendingBookings} color="#6A5B8C" to="/bookings" />
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-header">
            <h2 className="card-title">최근 7일 사진 업로드</h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} />
              <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '2px solid var(--color-border)', borderRadius: 0, fontSize: 12 }} />
              <Bar dataKey="photos" fill="#C7361B" radius={[0, 0, 0, 0]} name="사진" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h2 className="card-title">인기 사진 TOP 5</h2>
            <Link to="/stats" className="card-link">전체 통계 <ArrowUpRight size={12} /></Link>
          </div>
          <div className="top-photos-list">
            {topPhotos.map((p, i) => (
              <div key={p.id} className="top-photo-item">
                <span className="rank">#{i + 1}</span>
                <ImgWithFallback src={p.thumbnailUrl} alt={p.title} className="photo-thumb" />
                <div className="photo-info">
                  <div className="photo-title">{p.title}</div>
                  <div className="photo-meta">❤️ {p.likesCount} · 🔖 {p.savesCount}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <ActivityFeed />
      </div>

      <BookingCalendar />

      <WeeklyBookingList />

      <div className="dashboard-card full-width">
        <div className="card-header">
          <h2 className="card-title">최근 문의 5건</h2>
          <Link to="/inquiries" className="card-link">전체 문의 보기 <ArrowUpRight size={12} /></Link>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>보낸 사람</th><th>수신 작가</th><th>촬영 종류</th><th>희망 날짜</th><th>상태</th>
            </tr>
          </thead>
          <tbody>
            {recentInquiries.map(i => (
              <tr key={i.id}>
                <td>{i.senderName}<br /><small>{i.senderEmail}</small></td>
                <td>{i.receiverProfileName || '-'}</td>
                <td>{i.shootType || '-'}</td>
                <td>{i.shootDate || '-'}</td>
                <td>
                  <span className={`badge ${(i.read || i.isRead) ? 'badge-green' : 'badge-red'}`}>
                    {(i.read || i.isRead) ? '읽음' : '미읽음'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DashboardPage;

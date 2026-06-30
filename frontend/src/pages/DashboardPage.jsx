import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight } from 'lucide-react';
import { getApi } from '../utils/api';
import ImgWithFallback from '../components/common/ImgWithFallback';
import BookingCalendar from '../components/dashboard/BookingCalendar';
import WeeklyBookingList from '../components/dashboard/WeeklyBookingList';
import './DashboardPage.css';

const StatCard = ({ icon, label, value, color, to }) => (
  <Link to={to} className="stat-card" style={{ borderLeft: `4px solid ${color}` }}>
    <div className="stat-icon" style={{ background: color + '18', color }}>{icon}</div>
    <div className="stat-info">
      <div className="stat-value">{value?.toLocaleString() ?? '-'}</div>
      <div className="stat-label">{label}</div>
    </div>
    <ArrowUpRight size={14} className="stat-card-arrow" />
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

      <div className="stat-grid">
        <StatCard icon="👥" label="전체 회원"     value={summary?.totalMembers}    color="#6366f1" to="/members" />
        <StatCard icon="📷" label="전체 사진"     value={summary?.totalPhotos}     color="#22c55e" to="/photos" />
        <StatCard icon="📬" label="오늘 신규 문의" value={summary?.todayInquiries}  color="#f59e0b" to="/inquiries" />
        <StatCard icon="🔔" label="미읽음 문의"   value={summary?.unreadInquiries} color="#ef4444" to="/inquiries" />
        <StatCard icon="📅" label="오늘 예약"     value={summary?.todayBookings}   color="#0ea5e9" to="/bookings" />
        <StatCard icon="⏳" label="미확정 예약"   value={summary?.pendingBookings} color="#f59e0b" to="/bookings" />
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-header">
            <h2 className="card-title">최근 7일 사진 업로드</h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="photos" fill="#6366f1" radius={[4, 4, 0, 0]} name="사진" />
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
                <ImgWithFallback
                  src={p.thumbnailUrl}
                  alt={p.title}
                  className="photo-thumb"
                />
                <div className="photo-info">
                  <div className="photo-title">{p.title}</div>
                  <div className="photo-meta">❤️ {p.likesCount} · 🔖 {p.savesCount}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
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

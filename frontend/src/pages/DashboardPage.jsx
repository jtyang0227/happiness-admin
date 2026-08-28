import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getApi } from '../utils/api';
import ImgWithFallback from '../components/common/ImgWithFallback';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import BookingCalendar from '../components/dashboard/BookingCalendar';
import WeeklyBookingList from '../components/dashboard/WeeklyBookingList';
import './DashboardPage.css';

const PROCESS_STATUS_LABELS = { NEW: '신규', IN_PROGRESS: '처리중', RESOLVED: '완료', ON_HOLD: '보류' };
const PROCESS_STATUS_BADGES = { NEW: 'badge-red', IN_PROGRESS: 'badge-yellow', RESOLVED: 'badge-green', ON_HOLD: 'badge-draft' };

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
  const [pendingPortfolios, setPendingPortfolios] = useState([]);
  const [recentInquiries, setRecentInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getApi('/admin/stats/summary'),
      getApi('/admin/portfolios?status=PENDING&size=5'),
      getApi('/admin/inquiries?page=0&size=5'),
    ]).then(([sum, portfolios, inqs]) => {
      setSummary(sum);
      setPendingPortfolios(portfolios.content || []);
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
        <KpiCard icon="📋" label="심사 대기 포트폴리오" value={summary?.pendingPortfolios} color="#7A5C1E" to="/portfolios?status=PENDING" />
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card span-2">
          <div className="card-header">
            <h2 className="card-title">심사 대기 포트폴리오</h2>
            <Link to="/portfolios?status=PENDING" className="card-link">전체 보기 <ArrowUpRight size={12} /></Link>
          </div>
          {pendingPortfolios.length === 0 ? (
            <div className="empty-state">심사 대기 중인 포트폴리오가 없습니다.</div>
          ) : (
            <div className="top-photos-list">
              {pendingPortfolios.map(p => (
                <Link key={p.id} to="/portfolios?status=PENDING" className="top-photo-item">
                  <ImgWithFallback src={p.coverImageUrl} alt={p.title} className="photo-thumb" />
                  <div className="photo-info">
                    <div className="photo-title">{p.title}</div>
                    <div className="photo-meta">{p.authorName} · {p.createdAt?.slice(0, 10)}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
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
                  </span>{' '}
                  <span className={`badge ${PROCESS_STATUS_BADGES[i.processStatus] || 'badge-draft'}`}>
                    {PROCESS_STATUS_LABELS[i.processStatus] || i.processStatus}
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

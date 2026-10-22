import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Users, Camera, Mail, BellRing, CalendarDays, Hourglass, ClipboardList } from 'lucide-react';
import { getApi } from '../utils/api';
import ImgWithFallback from '../components/common/ImgWithFallback';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import BookingCalendar from '../components/dashboard/BookingCalendar';
import WeeklyBookingList from '../components/dashboard/WeeklyBookingList';
import './DashboardPage.css';

const PROCESS_STATUS_LABELS = { NEW: '신규', IN_PROGRESS: '처리중', RESOLVED: '완료', ON_HOLD: '보류' };
const PROCESS_STATUS_BADGES = { NEW: 'badge-red', IN_PROGRESS: 'badge-yellow', RESOLVED: 'badge-green', ON_HOLD: 'badge-draft' };

const KpiCard = ({ Icon, label, value, tone, to }) => (
  <Link to={to} className={`dash-kpi-card dash-kpi-card--${tone}`}>
    <div className="dash-kpi-icon"><Icon size={16} strokeWidth={1.75} /></div>
    <div className="dash-kpi-value">{value?.toLocaleString() ?? '-'}</div>
    <div className="dash-kpi-label">{label}</div>
    <ArrowUpRight size={13} className="kpi-arrow" />
  </Link>
);

const QueueCard = ({ label, count, to, top }) => (
  <div className={`queue-card${top ? ' queue-card--top' : ''}`}>
    <div className="queue-card-label">{label}</div>
    <div className="queue-card-count">{count?.toLocaleString() ?? '-'}<span>건</span></div>
    <Link to={to} className="queue-card-btn">바로 처리</Link>
  </div>
);

const DashboardPage = () => {
  const [summary, setSummary] = useState(null);
  const [pendingPortfolios, setPendingPortfolios] = useState([]);
  const [recentInquiries, setRecentInquiries] = useState([]);
  const [reportPending, setReportPending] = useState(null);
  const [verifyPending, setVerifyPending] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getApi('/admin/stats/summary'),
      getApi('/admin/portfolios?status=PENDING&size=5'),
      getApi('/admin/inquiries?page=0&size=5'),
      getApi('/admin/reports/counts').catch(() => null),
      getApi('/admin/verifications/counts').catch(() => null),
    ]).then(([sum, portfolios, inqs, rc, vc]) => {
      setReportPending(rc ? (rc.PENDING || 0) + (rc.IN_REVIEW || 0) : null);
      setVerifyPending(vc ? vc.PENDING || 0 : null);
      setSummary(sum);
      setPendingPortfolios(portfolios.content || []);
      setRecentInquiries(inqs.content || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading">로딩 중...</div>;

  const queues = [
    { label: '심사 대기 포트폴리오', count: summary?.pendingPortfolios, to: '/portfolios?status=PENDING' },
    { label: '미처리 신고', count: reportPending, to: '/reports' },
    { label: '작가 인증 대기', count: verifyPending, to: '/verifications' },
  ];
  const queueTotal = queues.reduce((n, q) => n + (q.count || 0), 0) + (summary?.unreadInquiries || 0);
  const topCount = Math.max(...queues.map(q => q.count || 0));

  return (
    <div className="dashboard-page">
      <section className="dash-hero">
        <div className="dash-hero-eyebrow">처리 대기</div>
        <div className="dash-hero-value">{queueTotal.toLocaleString()}<span>건</span></div>
        <div className="dash-hero-sub">
          심사·신고·인증 대기와 미읽음 문의 {summary?.unreadInquiries ?? 0}건을 합친 수치입니다.
        </div>
      </section>

      <div className="queue-grid">
        {queues.map(q => (
          <QueueCard key={q.label} {...q} top={topCount > 0 && q.count === topCount} />
        ))}
      </div>

      <div className="kpi-grid">
        <KpiCard Icon={Users}         label="전체 회원"     value={summary?.totalMembers}    tone="brand" to="/members" />
        <KpiCard Icon={Camera}        label="전체 사진"     value={summary?.totalPhotos}     tone="accent" to="/photos" />
        <KpiCard Icon={Mail}          label="오늘 신규 문의" value={summary?.todayInquiries}  tone="info" to="/inquiries" />
        <KpiCard Icon={BellRing}      label="미읽음 문의"   value={summary?.unreadInquiries} tone="danger" to="/inquiries" />
        <KpiCard Icon={CalendarDays}  label="오늘 예약"     value={summary?.todayBookings}   tone="info" to="/bookings" />
        <KpiCard Icon={Hourglass}     label="미확정 예약"   value={summary?.pendingBookings} tone="warning" to="/bookings" />
        <KpiCard Icon={ClipboardList} label="심사 대기 포트폴리오" value={summary?.pendingPortfolios} tone="warning" to="/portfolios?status=PENDING" />
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

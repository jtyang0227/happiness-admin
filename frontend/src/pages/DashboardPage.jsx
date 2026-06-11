import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getApi } from '../utils/api';
import './DashboardPage.css';

const StatCard = ({ icon, label, value, color }) => (
  <div className="stat-card" style={{ borderTopColor: color }}>
    <div className="stat-icon" style={{ background: color + '20', color }}>{icon}</div>
    <div className="stat-info">
      <div className="stat-value">{value?.toLocaleString() ?? '-'}</div>
      <div className="stat-label">{label}</div>
    </div>
  </div>
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
        <StatCard icon="👥" label="전체 회원" value={summary?.totalMembers} color="#6366f1" />
        <StatCard icon="📷" label="전체 사진" value={summary?.totalPhotos} color="#22c55e" />
        <StatCard icon="📬" label="오늘 신규 문의" value={summary?.todayInquiries} color="#f59e0b" />
        <StatCard icon="🔔" label="미읽음 문의" value={summary?.unreadInquiries} color="#ef4444" />
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h2 className="card-title">최근 7일 사진 업로드</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="photos" fill="#6366f1" radius={[4,4,0,0]} name="사진" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="dashboard-card">
          <h2 className="card-title">인기 사진 TOP 5</h2>
          <div className="top-photos-list">
            {topPhotos.map((p, i) => (
              <div key={p.id} className="top-photo-item">
                <span className="rank">#{i + 1}</span>
                <img src={p.thumbnailUrl} alt={p.title} className="photo-thumb" onError={e => e.target.style.display='none'} />
                <div className="photo-info">
                  <div className="photo-title">{p.title}</div>
                  <div className="photo-meta">❤️ {p.likesCount} · 🔖 {p.savesCount}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="dashboard-card full-width">
        <h2 className="card-title">최근 문의 5건</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>보낸 사람</th><th>수신 작가</th><th>촬영 종류</th><th>희망 날짜</th><th>상태</th>
            </tr>
          </thead>
          <tbody>
            {recentInquiries.map(i => (
              <tr key={i.id}>
                <td>{i.senderName}<br/><small>{i.senderEmail}</small></td>
                <td>{i.receiverProfileName || '-'}</td>
                <td>{i.shootType || '-'}</td>
                <td>{i.shootDate || '-'}</td>
                <td><span className={`badge ${(i.read || i.isRead) ? 'badge-green' : 'badge-red'}`}>
                  {(i.read || i.isRead) ? '읽음' : '미읽음'}
                </span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DashboardPage;

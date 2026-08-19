import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { getApi } from '../utils/api';
import ImgWithFallback from '../components/common/ImgWithFallback';
import './StatsPage.css';

const CHART_COLORS = ['#C7361B', '#3F8A57', '#B8791E', '#A82530', '#2F7A8C', '#6A5B8C', '#7BA23F', '#9C6B4E'];

const StatsPage = () => {
  const [days, setDays] = useState(30);
  const [daily, setDaily] = useState([]);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [topSortBy, setTopSortBy] = useState('likes');
  const [topPhotos, setTopPhotos] = useState([]);
  const [moodDist, setMoodDist] = useState([]);
  const [shootDist, setShootDist] = useState([]);
  const [photographers, setPhotographers] = useState([]);

  useEffect(() => {
    Promise.all([
      getApi('/admin/stats/mood-dist'),
      getApi('/admin/stats/shoot-type-dist'),
      getApi('/admin/stats/photographers?limit=10'),
    ]).then(([md, sd, pg]) => {
      setMoodDist(md);
      setShootDist(sd);
      setPhotographers(pg);
    });
  }, []);

  useEffect(() => {
    setDailyLoading(true);
    Promise.all([
      getApi(`/admin/stats/daily?days=${days}`),
      getApi(`/admin/stats/top-photos?sortBy=${topSortBy}`),
    ]).then(([dl, tp]) => {
      setDaily(dl);
      setTopPhotos(tp);
    }).finally(() => setDailyLoading(false));
  }, [days, topSortBy]);

  const kpi = {
    photos:    daily.reduce((s, d) => s + (d.photos    || 0), 0),
    signups:   daily.reduce((s, d) => s + (d.signups   || 0), 0),
    inquiries: daily.reduce((s, d) => s + (d.inquiries || 0), 0),
  };

  return (
    <div className="stats-page">
      <h1 className="page-title">통계</h1>

      <div className="stats-kpi-grid">
        <div className="stats-kpi-card">
          <div className="stats-kpi-label">사진 업로드 ({days}일)</div>
          <div className="stats-kpi-value">{kpi.photos.toLocaleString()}</div>
        </div>
        <div className="stats-kpi-card">
          <div className="stats-kpi-label">신규 가입 ({days}일)</div>
          <div className="stats-kpi-value">{kpi.signups.toLocaleString()}</div>
        </div>
        <div className="stats-kpi-card">
          <div className="stats-kpi-label">문의 접수 ({days}일)</div>
          <div className="stats-kpi-value">{kpi.inquiries.toLocaleString()}</div>
        </div>
      </div>

      <div className="stats-card">
        <div className="card-header">
          <h2 className="card-title">기간별 추이</h2>
          <div className="period-tabs">
            {[7, 30, 90].map(d => (
              <button key={d} className={`period-tab ${days === d ? 'active' : ''}`} onClick={() => setDays(d)}>
                {d}일
              </button>
            ))}
          </div>
        </div>
        {dailyLoading ? (
          <div className="page-loading" style={{ height: 260 }}>로딩 중...</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="photos" stroke="#C7361B" name="사진 업로드" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="signups" stroke="#3F8A57" name="신규 가입" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="inquiries" stroke="#B8791E" name="문의 접수" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="stats-row">
        <div className="stats-card half">
          <h2 className="card-title">색채 무드 분포</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={moodDist} dataKey="count" nameKey="label" cx="50%" cy="45%"
                outerRadius={75} label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                labelLine={false} fontSize={11}>
                {moodDist.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [v + '개', n]} />
              <Legend verticalAlign="bottom" height={36}
                formatter={(value, entry) => `${entry.payload.label} (${entry.payload.count}개)`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="stats-card half">
          <h2 className="card-title">촬영 종류별 문의</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={shootDist} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="label" type="category" tick={{ fontSize: 12 }} width={70} />
              <Tooltip />
              <Bar dataKey="count" fill="#C7361B" radius={[0, 0, 0, 0]} name="문의 수" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="stats-card">
        <div className="card-header">
          <h2 className="card-title">인기 사진 TOP 10</h2>
          <select className="filter-select" value={topSortBy} onChange={e => setTopSortBy(e.target.value)}>
            <option value="likes">좋아요순</option>
            <option value="saves">저장순</option>
            <option value="shares">공유순</option>
          </select>
        </div>
        <table className="data-table">
          <thead>
            <tr><th>#</th><th>썸네일</th><th>제목</th><th>작가</th><th>좋아요</th><th>저장</th><th>공유</th></tr>
          </thead>
          <tbody>
            {topPhotos.map((p, i) => (
              <tr key={p.id}>
                <td className="rank-cell">{i + 1}</td>
                <td>
                  <ImgWithFallback src={p.thumbnailUrl} alt={p.title} className="top-thumb" />
                </td>
                <td>{p.title}</td>
                <td>{p.authorName}</td>
                <td>❤️ {p.likesCount}</td>
                <td>🔖 {p.savesCount}</td>
                <td>🔄 {p.sharesCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="stats-card">
        <h2 className="card-title">작가 성과 TOP 10</h2>
        <table className="data-table">
          <thead>
            <tr><th>#</th><th>작가</th><th>프로필</th><th>사진 수</th><th>총 좋아요</th><th>총 저장</th></tr>
          </thead>
          <tbody>
            {photographers.length === 0 ? (
              <tr><td colSpan="6" className="loading-cell">데이터가 없습니다.</td></tr>
            ) : photographers.map((pg, i) => (
              <tr key={pg.memberId}>
                <td className="rank-cell">{i + 1}</td>
                <td className="name-cell">{pg.name}</td>
                <td style={{ color: 'var(--color-text-2)', fontSize: 12 }}>{pg.profileName}</td>
                <td>{pg.photoCount.toLocaleString()}</td>
                <td>❤️ {pg.totalLikes.toLocaleString()}</td>
                <td>🔖 {pg.totalSaves.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StatsPage;

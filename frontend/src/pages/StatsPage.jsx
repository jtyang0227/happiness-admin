import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { getApi } from '../utils/api';
import './StatsPage.css';

const COLORS = ['#6366f1','#22c55e','#f59e0b','#ef4444','#06b6d4','#a855f7','#ec4899','#84cc16'];

const StatsPage = () => {
  const [days, setDays] = useState(30);
  const [daily, setDaily] = useState([]);
  const [topSortBy, setTopSortBy] = useState('likes');
  const [topPhotos, setTopPhotos] = useState([]);
  const [moodDist, setMoodDist] = useState([]);
  const [shootDist, setShootDist] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getApi(`/admin/stats/daily?days=${days}`),
      getApi(`/admin/stats/top-photos?sortBy=${topSortBy}`),
      getApi('/admin/stats/mood-dist'),
      getApi('/admin/stats/shoot-type-dist'),
    ]).then(([dl, tp, md, sd]) => {
      setDaily(dl);
      setTopPhotos(tp);
      setMoodDist(md);
      setShootDist(sd);
    }).finally(() => setLoading(false));
  }, [days, topSortBy]);

  if (loading && daily.length === 0) return <div className="page-loading">로딩 중...</div>;

  return (
    <div className="stats-page">
      <h1 className="page-title">통계</h1>

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
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={daily}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="photos" stroke="#6366f1" name="사진 업로드" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="signups" stroke="#22c55e" name="신규 가입" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="inquiries" stroke="#f59e0b" name="문의 접수" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="stats-row">
        <div className="stats-card half">
          <h2 className="card-title">색채 무드 분포</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={moodDist} dataKey="count" nameKey="label" cx="50%" cy="50%"
                outerRadius={90} label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`}
                labelLine={false} fontSize={11}>
                {moodDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [v + '개', n]} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="stats-card half">
          <h2 className="card-title">촬영 종류별 문의</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={shootDist} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="label" type="category" tick={{ fontSize: 12 }} width={70} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[0,4,4,0]} name="문의 수" />
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
                <td><img src={p.thumbnailUrl} alt={p.title} className="top-thumb" onError={e => e.target.style.display='none'} /></td>
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
    </div>
  );
};

export default StatsPage;

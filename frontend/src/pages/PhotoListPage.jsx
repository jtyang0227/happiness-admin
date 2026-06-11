import React, { useEffect, useState, useCallback } from 'react';
import { getApi, deleteApi } from '../utils/api';
import Pagination from '../components/common/Pagination';
import './PhotoListPage.css';

const MOODS = ['WARM','COOL','NEUTRAL','VIVID','DARK','SOFT'];

const PhotoListPage = () => {
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [colorMood, setColorMood] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, size: 24, sortBy });
    if (colorMood) params.set('colorMood', colorMood);
    getApi(`/admin/photos?${params}`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [page, colorMood, sortBy]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`"${title}" 사진을 삭제하시겠습니까?`)) return;
    await deleteApi(`/admin/photos/${id}`);
    fetchData();
  };

  return (
    <div className="list-page">
      <div className="page-header">
        <h1 className="page-title">사진 관리</h1>
        <span className="total-count">총 {data.totalElements?.toLocaleString()}장</span>
      </div>
      <div className="filter-bar">
        <select className="filter-select" value={colorMood} onChange={e => { setColorMood(e.target.value); setPage(0); }}>
          <option value="">전체 무드</option>
          {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select className="filter-select" value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(0); }}>
          <option value="latest">최신순</option>
          <option value="likes">좋아요순</option>
          <option value="saves">저장순</option>
          <option value="shares">공유순</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-msg">로딩 중...</div>
      ) : (
        <div className="photo-grid">
          {data.content.map(p => (
            <div key={p.id} className="photo-card">
              <div className="photo-img-wrap">
                <img src={p.thumbnailUrl || p.imageUrl} alt={p.title}
                  className="photo-img" onError={e => { e.target.src = ''; e.target.style.background='#f1f5f9'; }} />
                {p.colorMood && <span className="mood-badge">{p.colorMood}</span>}
              </div>
              <div className="photo-body">
                <div className="photo-title">{p.title}</div>
                <div className="photo-author">{p.authorName}</div>
                <div className="photo-stats">❤️ {p.likesCount} · 🔖 {p.savesCount} · 🔄 {p.sharesCount}</div>
                <div className="photo-date">{p.createdAt?.slice(0,10)}</div>
                <button className="btn-danger-sm" onClick={() => handleDelete(p.id, p.title)}>삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
    </div>
  );
};

export default PhotoListPage;

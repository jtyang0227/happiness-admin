import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getApi, deleteApi } from '../utils/api';
import { useConfirm } from '../context/ConfirmContext';
import Pagination from '../components/common/Pagination';
import ImgWithFallback from '../components/common/ImgWithFallback';
import './PhotoListPage.css';

const MOODS = ['WARM', 'COOL', 'NEUTRAL', 'VIVID', 'DARK', 'SOFT'];

const Highlight = ({ text, keyword }) => {
  if (!keyword || !text) return text;
  const parts = text.split(new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === keyword.toLowerCase()
      ? <mark key={i} className="search-highlight">{part}</mark>
      : part
  );
};

const PhotoListPage = () => {
  const { confirm } = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();

  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState(searchParams.get('search') || '');
  const searchTimerRef = useRef(null);

  const search    = searchParams.get('search')    || '';
  const colorMood = searchParams.get('colorMood') || '';
  const sortBy    = searchParams.get('sortBy')    || 'latest';
  const page      = parseInt(searchParams.get('page') || '0', 10);

  const updateParams = (updates) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([k, v]) => {
        if (v === '' || v === null || v === undefined) next.delete(k);
        else next.set(k, String(v));
      });
      return next;
    });
  };

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, size: 24, sortBy });
    if (colorMood) params.set('colorMood', colorMood);
    if (search) params.set('search', search);
    getApi(`/admin/photos?${params}`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [page, colorMood, sortBy, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id, title) => {
    const ok = await confirm({
      title: '사진 삭제',
      description: `"${title}" 사진을 삭제하시겠습니까?`,
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteApi(`/admin/photos/${id}`);
      toast.success('사진이 삭제되었습니다.');
      fetchData();
    } catch {
      toast.error('삭제에 실패했습니다.');
    }
  };

  const isFiltered = search || colorMood;

  return (
    <div className="list-page">
      <div className="page-header">
        <h1 className="page-title">사진 관리</h1>
        <span className="total-count">
          {isFiltered
            ? `"${search || colorMood}" 검색 결과 — ${data.totalElements?.toLocaleString()}장`
            : `총 ${data.totalElements?.toLocaleString()}장`}
        </span>
      </div>
      <div className="filter-bar">
        <input
          className="search-input"
          placeholder="제목·작가·설명·@아이디 검색"
          value={inputValue}
          onChange={e => {
            const val = e.target.value;
            setInputValue(val);
            clearTimeout(searchTimerRef.current);
            searchTimerRef.current = setTimeout(() => {
              updateParams({ search: val, page: '' });
            }, 300);
          }}
        />
        <select className="filter-select" value={colorMood} onChange={e => updateParams({ colorMood: e.target.value, page: '' })}>
          <option value="">전체 무드</option>
          {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select className="filter-select" value={sortBy} onChange={e => updateParams({ sortBy: e.target.value, page: '' })}>
          <option value="latest">최신순</option>
          <option value="likes">좋아요순</option>
          <option value="saves">저장순</option>
          <option value="shares">공유순</option>
        </select>
        {isFiltered && (
          <button className="btn-reset" onClick={() => { setInputValue(''); setSearchParams({}); }}>
            초기화
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-msg">로딩 중...</div>
      ) : data.content.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">검색</div>
          <div className="empty-title">
            {search ? `"${search}"에 대한 결과가 없습니다` : '사진이 없습니다'}
          </div>
          <div className="empty-desc">검색어를 다시 확인하거나 필터를 변경해 보세요.</div>
        </div>
      ) : (
        <div className="photo-grid">
          {data.content.map(p => (
            <div key={p.id} className="photo-card">
              <div className="photo-img-wrap">
                <ImgWithFallback
                  src={p.thumbnailUrl || p.imageUrl}
                  alt={p.title}
                  className="photo-img"
                />
                {p.colorMood && <span className="mood-badge">{p.colorMood}</span>}
              </div>
              <div className="photo-body">
                <div className="photo-title">
                  <Highlight text={p.title} keyword={search} />
                </div>
                <div className="photo-author">
                  <Highlight text={p.authorName} keyword={search} />
                </div>
                <div className="photo-stats">❤️ {p.likesCount} · 🔖 {p.savesCount} · 🔄 {p.sharesCount}</div>
                <div className="photo-date">{p.createdAt?.slice(0, 10)}</div>
                <button className="btn-danger-sm" onClick={() => handleDelete(p.id, p.title)}>삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={data.totalPages} onPageChange={p => updateParams({ page: p === 0 ? '' : p })} />
    </div>
  );
};

export default PhotoListPage;

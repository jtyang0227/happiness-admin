import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getApi, deleteApi, patchApi } from '../utils/api';
import { useConfirm } from '../context/ConfirmContext';
import Pagination from '../components/common/Pagination';
import ImgWithFallback from '../components/common/ImgWithFallback';
import SlideOver from '../components/common/SlideOver';
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

const CategorySelects = ({ cats, values, onChange }) => {
  if (!cats) return null;
  return (
    <>
      {[1, 2, 3, 4, 5].map(lv => {
        const options = cats[lv] || [];
        if (!options.length) return null;
        const labels = ['촬영종류', '촬영환경', '색채무드', '스타일', '세부속성'];
        return (
          <select
            key={lv}
            className="filter-select"
            value={values[`l${lv}`] || ''}
            onChange={e => onChange(`l${lv}`, e.target.value)}
          >
            <option value="">{labels[lv - 1]}</option>
            {options.map(c => (
              <option key={c.code} value={c.code}>{c.nameKo}</option>
            ))}
          </select>
        );
      })}
    </>
  );
};

const PhotoListPage = () => {
  const { confirm } = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();

  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [loading, setLoading] = useState(false);
  const [cats, setCats] = useState(null);
  const [inputValue, setInputValue] = useState(searchParams.get('search') || '');
  const [slidePhoto, setSlidePhoto] = useState(null);
  const [codeInput, setCodeInput] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);
  const searchTimerRef = useRef(null);

  const search    = searchParams.get('search')    || '';
  const colorMood = searchParams.get('colorMood') || '';
  const sortBy    = searchParams.get('sortBy')    || 'latest';
  const page      = parseInt(searchParams.get('page') || '0', 10);
  const l1 = searchParams.get('l1') || '';
  const l2 = searchParams.get('l2') || '';
  const l3 = searchParams.get('l3') || '';
  const l4 = searchParams.get('l4') || '';
  const l5 = searchParams.get('l5') || '';

  useEffect(() => {
    getApi('/admin/categories').then(setCats);
  }, []);

  const updateParams = useCallback((updates) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([k, v]) => {
        if (v === '' || v === null || v === undefined) next.delete(k);
        else next.set(k, String(v));
      });
      return next;
    });
  }, [setSearchParams]);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, size: 24, sortBy });
    if (colorMood) params.set('colorMood', colorMood);
    if (search)    params.set('search', search);
    if (l1) params.set('l1', l1);
    if (l2) params.set('l2', l2);
    if (l3) params.set('l3', l3);
    if (l4) params.set('l4', l4);
    if (l5) params.set('l5', l5);
    getApi(`/admin/photos?${params}`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [page, colorMood, sortBy, search, l1, l2, l3, l4, l5]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id, title) => {
    const ok = await confirm({ title: '사진 삭제', description: `"${title}" 사진을 삭제하시겠습니까?`, variant: 'danger' });
    if (!ok) return;
    try {
      await deleteApi(`/admin/photos/${id}`);
      toast.success('사진이 삭제되었습니다.');
      fetchData();
    } catch {
      toast.error('삭제에 실패했습니다.');
    }
  };

  const handleSaveCode = async () => {
    if (!slidePhoto || codeInput.length !== 10 || !/^\d{10}$/.test(codeInput)) {
      toast.error('10자리 숫자 코드를 입력해 주세요.');
      return;
    }
    setCodeLoading(true);
    try {
      await patchApi(`/admin/photos/${slidePhoto.id}/category-code`, { categoryCode: codeInput });
      toast.success('카테고리 코드가 저장되었습니다.');
      setSlidePhoto(null);
      fetchData();
    } catch {
      toast.error('저장에 실패했습니다.');
    } finally {
      setCodeLoading(false);
    }
  };

  const isFiltered = search || colorMood || l1 || l2 || l3 || l4 || l5;
  const catValues = { l1, l2, l3, l4, l5 };

  const decodeCat = (photo) => {
    return [
      { lv: 'l1', label: photo.l1Name },
      { lv: 'l2', label: photo.l2Name },
    ].filter(c => c.label && c.label !== '00');
  };

  return (
    <div className="list-page">
      <div className="page-header">
        <h1 className="page-title">사진 관리</h1>
        <span className="total-count">
          {isFiltered
            ? `검색 결과 — ${data.totalElements?.toLocaleString()}장`
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
            searchTimerRef.current = setTimeout(() => updateParams({ search: val, page: '' }), 300);
          }}
        />
        <CategorySelects
          cats={cats}
          values={catValues}
          onChange={(key, val) => updateParams({ [key]: val, page: '' })}
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
          <button className="btn btn-ghost btn-sm" onClick={() => { setInputValue(''); setSearchParams({}); }}>
            초기화
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-msg">로딩 중...</div>
      ) : data.content.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <div className="empty-title">
            {search ? `"${search}"에 대한 결과가 없습니다` : '사진이 없습니다'}
          </div>
          <div className="empty-desc">검색어를 다시 확인하거나 필터를 변경해 보세요.</div>
        </div>
      ) : (
        <div className="photo-grid">
          {data.content.map(p => (
            <div key={p.id} className="photo-card" onClick={() => { setSlidePhoto(p); setCodeInput(p.categoryCode || '0000000000'); }}>
              <div className="photo-img-wrap">
                <ImgWithFallback src={p.thumbnailUrl || p.imageUrl} alt={p.title} className="photo-img" />
                {p.colorMood && <span className="mood-badge">{p.colorMood}</span>}
                {decodeCat(p).map(c => (
                  <span key={c.lv} className={`cat-badge cat-badge-${c.lv}`}>{c.label}</span>
                ))}
              </div>
              <div className="photo-body">
                <div className="photo-title"><Highlight text={p.title} keyword={search} /></div>
                <div className="photo-author"><Highlight text={p.authorName} keyword={search} /></div>
                {p.categoryCode && p.categoryCode !== '0000000000' && (
                  <div className="photo-code code-badge">{p.categoryCode}</div>
                )}
                <div className="photo-stats">❤️ {p.likesCount} · 🔖 {p.savesCount} · 🔄 {p.sharesCount}</div>
                <div className="photo-date">{p.createdAt?.slice(0, 10)}</div>
                <button
                  className="btn btn-danger-full btn-sm"
                  onClick={e => { e.stopPropagation(); handleDelete(p.id, p.title); }}
                >삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={data.totalPages}
        onPageChange={p => updateParams({ page: p === 0 ? '' : p })}
      />

      <SlideOver
        open={!!slidePhoto}
        onClose={() => setSlidePhoto(null)}
        title="사진 상세 / 카테고리 지정"
        footer={
          <>
            <button className="btn btn-ghost btn-md" onClick={() => setSlidePhoto(null)}>닫기</button>
            <button className="btn btn-primary btn-md" onClick={handleSaveCode} disabled={codeLoading}>
              {codeLoading ? '저장 중...' : '코드 저장'}
            </button>
          </>
        }
      >
        {slidePhoto && (
          <>
            <ImgWithFallback
              src={slidePhoto.thumbnailUrl || slidePhoto.imageUrl}
              alt={slidePhoto.title}
              className="so-detail-img"
            />
            <div className="so-field">
              <span className="so-label">제목</span>
              <span className="so-value">{slidePhoto.title}</span>
            </div>
            <div className="so-field">
              <span className="so-label">작가</span>
              <span className="so-value">{slidePhoto.authorName}</span>
            </div>
            <div className="so-field">
              <span className="so-label">색채 무드</span>
              <span className="so-value">{slidePhoto.colorMood || '-'}</span>
            </div>
            <div className="so-field">
              <span className="so-label">통계</span>
              <span className="so-value">❤️ {slidePhoto.likesCount} · 🔖 {slidePhoto.savesCount} · 🔄 {slidePhoto.sharesCount}</span>
            </div>
            <div className="so-field">
              <span className="so-label">등록일</span>
              <span className="so-value">{slidePhoto.createdAt?.slice(0, 10)}</span>
            </div>
            <hr className="so-divider" />
            <div className="so-field">
              <span className="so-label">확인 구분자 (10자리)</span>
              <input
                className="search-input"
                style={{ width: '100%', marginTop: 6, fontFamily: 'var(--font-mono)', letterSpacing: '0.15em' }}
                maxLength={10}
                value={codeInput}
                onChange={e => setCodeInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="0000000000"
              />
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                형식: 1차(2자리) + 2차(2자리) + 3차(2자리) + 4차(2자리) + 5차(2자리)
              </div>
            </div>
            {cats && (
              <div className="so-cat-grid">
                {[1, 2, 3, 4, 5].map(lv => {
                  const levelCode = codeInput.slice((lv - 1) * 2, lv * 2);
                  const match = (cats[lv] || []).find(c => c.code === levelCode);
                  const labels = ['1차 촬영종류', '2차 촬영환경', '3차 색채무드', '4차 스타일', '5차 세부속성'];
                  return (
                    <div key={lv} className="so-cat-row">
                      <span className={`badge badge-cat-l${lv}`}>{labels[lv - 1]}</span>
                      <select
                        className="filter-select"
                        style={{ flex: 1 }}
                        value={levelCode}
                        onChange={e => {
                          const next = codeInput.padEnd(10, '0').split('');
                          const pos = (lv - 1) * 2;
                          next[pos] = e.target.value[0]; next[pos + 1] = e.target.value[1];
                          setCodeInput(next.join(''));
                        }}
                      >
                        <option value="00">미분류</option>
                        {(cats[lv] || []).filter(c => c.code !== '00').map(c => (
                          <option key={c.code} value={c.code}>{c.code} — {c.nameKo}</option>
                        ))}
                      </select>
                      {match && match.code !== '00' && (
                        <span className="so-value" style={{ minWidth: 60, fontSize: 'var(--text-xs)' }}>{match.nameKo}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </SlideOver>
    </div>
  );
};

export default PhotoListPage;

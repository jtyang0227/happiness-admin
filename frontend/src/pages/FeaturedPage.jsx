import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getApi, postApi, deleteApi, patchApi } from '../utils/api';
import { useConfirm } from '../context/ConfirmContext';
import ImgWithFallback from '../components/common/ImgWithFallback';
import './FeaturedPage.css';

const MAX_FEATURED = 10;

const FeaturedPage = () => {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [adding, setAdding] = useState(false);
  const { confirm } = useConfirm();

  const loadFeatured = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getApi('/admin/featured');
      setFeatured(data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFeatured(); }, [loadFeatured]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const data = await getApi(`/admin/photos?search=${encodeURIComponent(searchQuery)}&size=12&page=0`);
      setSearchResults(data.content || []);
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async () => {
    if (!selectedPhoto) return;
    setAdding(true);
    try {
      await postApi('/admin/featured', {
        photoId: selectedPhoto.id,
        startsAt: startsAt || null,
        endsAt: endsAt || null,
      });
      toast.success('피처드에 추가되었습니다.');
      setShowAddModal(false);
      setSelectedPhoto(null);
      setSearchQuery('');
      setSearchResults([]);
      setStartsAt('');
      setEndsAt('');
      loadFeatured();
    } catch (e) {
      toast.error(e?.message || '추가에 실패했습니다.');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (item) => {
    const ok = await confirm({
      title: '피처드 제거',
      description: `"${item.photoTitle}"을(를) 피처드에서 제거하시겠습니까?`,
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteApi(`/admin/featured/${item.id}`);
      toast.success('제거되었습니다.');
      loadFeatured();
    } catch {
      toast.error('제거에 실패했습니다.');
    }
  };

  const handleMoveUp = async (index) => {
    if (index === 0) return;
    const reordered = [...featured];
    [reordered[index - 1], reordered[index]] = [reordered[index], reordered[index - 1]];
    setFeatured(reordered);
    await saveOrder(reordered);
  };

  const handleMoveDown = async (index) => {
    if (index === featured.length - 1) return;
    const reordered = [...featured];
    [reordered[index], reordered[index + 1]] = [reordered[index + 1], reordered[index]];
    setFeatured(reordered);
    await saveOrder(reordered);
  };

  const saveOrder = async (items) => {
    try {
      await patchApi('/admin/featured/reorder', { orderedIds: items.map(i => i.id) });
    } catch {
      toast.error('순서 저장에 실패했습니다.');
      loadFeatured();
    }
  };

  return (
    <div className="featured-page">
      <div className="featured-header">
        <div>
          <h1 className="page-title">피처드 콘텐츠</h1>
          <p className="featured-subtitle">홈 화면에 노출될 사진을 선택합니다 (최대 {MAX_FEATURED}개)</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowAddModal(true)}
          disabled={featured.length >= MAX_FEATURED}
        >
          + 사진 추가
        </button>
      </div>

      <div className="featured-count-bar">
        <div className="featured-count-track">
          <div
            className="featured-count-fill"
            style={{ width: `${(featured.length / MAX_FEATURED) * 100}%` }}
          />
        </div>
        <span className="featured-count-label">{featured.length} / {MAX_FEATURED}</span>
      </div>

      {loading ? (
        <div className="page-loading">로딩 중...</div>
      ) : featured.length === 0 ? (
        <div className="featured-empty">
          <p>피처드 사진이 없습니다.</p>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>첫 번째 사진 추가</button>
        </div>
      ) : (
        <div className="featured-list">
          {featured.map((item, index) => (
            <div key={item.id} className="featured-item">
              <div className="featured-order-badge">{index + 1}</div>
              <ImgWithFallback src={item.thumbnailUrl} alt={item.photoTitle} className="featured-thumb" />
              <div className="featured-info">
                <div className="featured-photo-title">{item.photoTitle}</div>
                <div className="featured-meta">
                  <span>작가: {item.authorName}</span>
                  <span>❤ {item.likesCount}</span>
                  {item.startsAt && <span>시작: {item.startsAt}</span>}
                  {item.endsAt && <span>종료: {item.endsAt}</span>}
                </div>
              </div>
              <div className="featured-actions">
                <button className="feat-btn-icon" onClick={() => handleMoveUp(index)} disabled={index === 0} title="위로">▲</button>
                <button className="feat-btn-icon" onClick={() => handleMoveDown(index)} disabled={index === featured.length - 1} title="아래로">▼</button>
                <button className="feat-btn-remove" onClick={() => handleRemove(item)}>제거</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay" onClick={() => !adding && setShowAddModal(false)}>
          <div className="modal-dialog featured-modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">피처드 사진 추가</h3>

            <div className="feat-search-row">
              <input
                className="feat-search-input"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="제목, 작가명으로 검색..."
              />
              <button className="btn-primary" onClick={handleSearch} disabled={searching}>
                {searching ? '검색 중...' : '검색'}
              </button>
            </div>

            {selectedPhoto && (
              <div className="feat-selected">
                <span className="feat-selected-label">선택됨:</span>
                <ImgWithFallback src={selectedPhoto.thumbnailUrl} alt={selectedPhoto.title} className="feat-selected-thumb" />
                <span>{selectedPhoto.title}</span>
                <button className="feat-deselect" onClick={() => setSelectedPhoto(null)}>✕</button>
              </div>
            )}

            <div className="feat-search-results">
              {searchResults.map(p => (
                <div
                  key={p.id}
                  className={`feat-result-item${selectedPhoto?.id === p.id ? ' selected' : ''}`}
                  onClick={() => setSelectedPhoto(p)}
                >
                  <ImgWithFallback src={p.thumbnailUrl} alt={p.title} className="feat-result-thumb" />
                  <div>
                    <div className="feat-result-title">{p.title}</div>
                    <div className="feat-result-meta">{p.authorName} · ❤ {p.likesCount}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="feat-date-row">
              <label>노출 시작일 <input type="date" value={startsAt} onChange={e => setStartsAt(e.target.value)} /></label>
              <label>노출 종료일 <input type="date" value={endsAt} onChange={e => setEndsAt(e.target.value)} /></label>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowAddModal(false)} disabled={adding}>취소</button>
              <button className="btn-primary" onClick={handleAdd} disabled={!selectedPhoto || adding}>
                {adding ? '추가 중...' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeaturedPage;

import React, { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getApi, putApi } from '../utils/api';
import ImgWithFallback from '../components/common/ImgWithFallback';
import './GalleryOrderPage.css';

const GalleryOrderPage = () => {
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [photos, setPhotos] = useState([]);
  const [originalOrder, setOriginalOrder] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const dragItem = useRef(null);
  const dragOver = useRef(null);

  useEffect(() => {
    getApi('/admin/members?size=100&page=0').then(data => {
      setMembers(data.content || []);
    });
  }, []);

  const loadPhotos = useCallback(async (memberId) => {
    if (!memberId) return;
    setLoading(true);
    setIsDirty(false);
    setSavedOk(false);
    try {
      const data = await getApi(`/admin/photos?memberId=${memberId}&size=100&page=0&sortBy=displayOrder`);
      const sorted = (data.content || []).slice().sort((a, b) => a.displayOrder - b.displayOrder);
      setPhotos(sorted);
      setOriginalOrder(sorted.map(p => p.id));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPhotos(selectedMember);
  }, [selectedMember, loadPhotos]);

  const handleDragStart = (e, index) => {
    dragItem.current = index;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e, index) => {
    dragOver.current = index;
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (dragItem.current === null || dragOver.current === null) return;
    if (dragItem.current === dragOver.current) return;
    const reordered = [...photos];
    const [moved] = reordered.splice(dragItem.current, 1);
    reordered.splice(dragOver.current, 0, moved);
    dragItem.current = null;
    dragOver.current = null;
    setPhotos(reordered);
    setIsDirty(true);
    setSavedOk(false);
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleReset = () => {
    const restored = [...photos].sort((a, b) =>
      originalOrder.indexOf(a.id) - originalOrder.indexOf(b.id)
    );
    setPhotos(restored);
    setIsDirty(false);
    setSavedOk(false);
  };

  const handleAutoSort = (by) => {
    const sorted = [...photos].sort((a, b) => {
      if (by === 'likes') return b.likesCount - a.likesCount;
      if (by === 'saves') return b.savesCount - a.savesCount;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    setPhotos(sorted);
    setIsDirty(true);
    setSavedOk(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const items = photos.map((p, i) => ({ id: p.id, displayOrder: i }));
      await putApi('/admin/photos/reorder', items);
      setOriginalOrder(photos.map(p => p.id));
      setIsDirty(false);
      setSavedOk(true);
      toast.success('순서가 저장되었습니다.');
      setTimeout(() => setSavedOk(false), 3000);
    } catch {
      toast.error('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="gallery-order-page">
      <div className="go-header">
        <div>
          <h1 className="page-title">갤러리 순서 관리</h1>
          <p className="go-subtitle">드래그로 표시 순서를 변경한 뒤 저장하세요</p>
        </div>
      </div>

      <div className="go-toolbar">
        <select
          className="filter-select"
          value={selectedMember}
          onChange={e => setSelectedMember(e.target.value)}
        >
          <option value="">작가 선택...</option>
          {members.map(m => (
            <option key={m.id} value={m.id}>{m.name} ({m.profileName})</option>
          ))}
        </select>

        {selectedMember && (
          <>
            <span className="go-count">사진 {photos.length}장</span>
            <div className="go-sort-btns">
              <button className="btn-sm-outline" onClick={() => handleAutoSort('date')}>날짜순</button>
              <button className="btn-sm-outline" onClick={() => handleAutoSort('likes')}>좋아요순</button>
              <button className="btn-sm-outline" onClick={() => handleAutoSort('saves')}>저장순</button>
            </div>
          </>
        )}
      </div>

      {isDirty && (
        <div className="go-dirty-banner">
          <span>⚠ 저장하지 않은 변경사항이 있습니다</span>
          <div className="go-dirty-actions">
            <button className="btn-sm-outline" onClick={handleReset} disabled={saving}>되돌리기</button>
            <button
              className={`go-save-btn ${saving ? 'saving' : ''}`}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? '저장 중...' : '● 순서 저장'}
            </button>
          </div>
        </div>
      )}

      {savedOk && !isDirty && (
        <div className="go-saved-banner">✓ 저장되었습니다</div>
      )}

      {!selectedMember ? (
        <div className="go-empty">작가를 선택하면 사진 목록이 표시됩니다.</div>
      ) : loading ? (
        <div className="page-loading">로딩 중...</div>
      ) : photos.length === 0 ? (
        <div className="go-empty">등록된 사진이 없습니다.</div>
      ) : (
        <div className="go-grid">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className={`go-card${dragItem.current === index ? ' dragging' : ''}${dragOver.current === index ? ' drag-over' : ''}`}
              draggable
              onDragStart={e => handleDragStart(e, index)}
              onDragEnter={e => handleDragEnter(e, index)}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <span className="go-badge">{index + 1}</span>
              <ImgWithFallback src={photo.thumbnailUrl} alt={photo.title} className="go-thumb" />
              <div className="go-title">{photo.title}</div>
              <div className="go-meta">❤ {photo.likesCount}</div>
              <div className="go-drag-handle">⠿</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GalleryOrderPage;

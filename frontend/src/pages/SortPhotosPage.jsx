import React, { useEffect, useRef, useState } from 'react';
import { GripVertical, Save, RotateCcw, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApi, putApi } from '../utils/api';
import { useDragSort } from '../hooks/useDragSort';
import './SortPhotosPage.css';

const BlurImg = ({ src, alt }) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <img
      src={src || 'https://picsum.photos/seed/ph/80/60'}
      alt={alt}
      className={`sp-thumb${loaded ? ' loaded' : ''}`}
      onLoad={() => setLoaded(true)}
    />
  );
};

const SortPhotosPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const rowRefs = useRef([]);
  const {
    items, reset, dragIdx, overIdx, isDirty,
    onDragStart, onDragOver, onDrop, onDragEnd, toReorderPayload,
  } = useDragSort([]);

  useEffect(() => {
    getApi('/admin/sort/photos')
      .then(data => reset(data))
      .catch(() => toast.error('사진 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => e.target.classList.toggle('visible', e.isIntersecting)),
      { threshold: 0.05 }
    );
    rowRefs.current.forEach(r => r && obs.observe(r));
    return () => obs.disconnect();
  }, [items]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await putApi('/admin/sort/photos', toReorderPayload());
      toast.success('사진 정렬이 저장되었습니다.');
      reset(items.map((it, idx) => ({ ...it, displayOrder: idx + 1 })));
    } catch {
      toast.error('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    getApi('/admin/sort/photos')
      .then(data => { reset(data); toast('정렬을 초기화했습니다.'); })
      .catch(() => toast.error('불러오기 실패'));
  };

  return (
    <div className="sp-page">
      <div className="sp-header">
        <div className="sp-header-left">
          <span className="sp-icon"><ImageIcon size={20} /></span>
          <div>
            <h1 className="sp-title">사진 정렬 관리</h1>
            <p className="sp-subtitle">드래그로 순서를 변경하고 저장하면 앱에 즉시 반영됩니다.</p>
          </div>
        </div>
        <div className="sp-actions">
          {isDirty && (
            <button className="sp-btn sp-btn-ghost" onClick={handleReset}>
              <RotateCcw size={14} /> 초기화
            </button>
          )}
          <button
            className={`sp-btn sp-btn-brand${isDirty ? '' : ' sp-btn-disabled'}`}
            onClick={handleSave}
            disabled={!isDirty || saving}
          >
            <Save size={14} /> {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>

      {isDirty && <div className="sp-dirty-banner">변경사항이 있습니다. 저장 버튼을 눌러 적용하세요.</div>}

      <div className="sp-count">{items.length}개 사진</div>

      {loading ? (
        <div className="sp-skeleton-list">
          {[...Array(8)].map((_, i) => <div key={i} className="sp-skeleton-row" />)}
        </div>
      ) : (
        <ul className="sp-list">
          {items.map((photo, idx) => (
            <li
              key={photo.id}
              ref={el => rowRefs.current[idx] = el}
              className={`sp-row${dragIdx === idx ? ' dragging' : ''}${overIdx === idx ? ' drag-over' : ''}`}
              draggable
              onDragStart={e => onDragStart(e, idx)}
              onDragOver={e => onDragOver(e, idx)}
              onDrop={e => onDrop(e, idx)}
              onDragEnd={onDragEnd}
            >
              <span className="sp-grip"><GripVertical size={16} /></span>
              <span className="sp-num">{idx + 1}</span>
              <BlurImg src={photo.thumbnailUrl} alt={photo.title} />
              <div className="sp-info">
                <span className="sp-name">{photo.title}</span>
                <span className="sp-meta">{photo.memberName}</span>
              </div>
              {photo.displayOrder === 0 && <span className="sp-badge sp-badge-unset">미설정</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SortPhotosPage;

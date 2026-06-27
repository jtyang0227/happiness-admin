import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GripVertical, Save, RotateCcw, ChevronLeft, Images } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApi, putApi } from '../utils/api';
import { useDragSort } from '../hooks/useDragSort';
import './SortSeriesDetailPage.css';

const BlurImg = ({ src, alt }) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <img
      src={src || 'https://picsum.photos/seed/sp/80/60'}
      alt={alt}
      className={`ssd-thumb${loaded ? ' loaded' : ''}`}
      onLoad={() => setLoaded(true)}
    />
  );
};

const SortSeriesDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seriesTitle, setSeriesTitle] = useState('');
  const rowRefs = useRef([]);
  const {
    items, reset, dragIdx, overIdx, isDirty,
    onDragStart, onDragOver, onDrop, onDragEnd, toReorderPayload,
  } = useDragSort([]);

  useEffect(() => {
    Promise.all([
      getApi(`/admin/sort/series/${id}/photos`),
      getApi('/admin/sort/series'),
    ])
      .then(([photos, seriesList]) => {
        reset(photos);
        const found = seriesList.find(s => String(s.id) === String(id));
        if (found) setSeriesTitle(found.title);
      })
      .catch(() => toast.error('데이터를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

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
      await putApi(`/admin/sort/series/${id}/photos`, toReorderPayload());
      toast.success('사진 순서가 저장되었습니다.');
      reset(items.map((it, idx) => ({ ...it, displayOrder: idx + 1 })));
    } catch {
      toast.error('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    getApi(`/admin/sort/series/${id}/photos`)
      .then(data => { reset(data); toast('정렬을 초기화했습니다.'); })
      .catch(() => toast.error('불러오기 실패'));
  };

  return (
    <div className="ssd-page">
      <div className="ssd-breadcrumb">
        <button className="ssd-back" onClick={() => navigate('/sort/series')}>
          <ChevronLeft size={16} /> 시리즈 정렬
        </button>
        <span className="ssd-breadcrumb-sep">/</span>
        <span className="ssd-breadcrumb-cur">{seriesTitle || `시리즈 #${id}`}</span>
      </div>

      <div className="ssd-header">
        <div className="ssd-header-left">
          <span className="ssd-icon"><Images size={20} /></span>
          <div>
            <h1 className="ssd-title">{seriesTitle || `시리즈 #${id}`} — 사진 순서</h1>
            <p className="ssd-subtitle">시리즈 내 사진 표시 순서를 드래그로 변경하세요.</p>
          </div>
        </div>
        <div className="ssd-actions">
          {isDirty && (
            <button className="ssd-btn ssd-btn-ghost" onClick={handleReset}>
              <RotateCcw size={14} /> 초기화
            </button>
          )}
          <button
            className={`ssd-btn ssd-btn-brand${isDirty ? '' : ' ssd-btn-disabled'}`}
            onClick={handleSave}
            disabled={!isDirty || saving}
          >
            <Save size={14} /> {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>

      {isDirty && (
        <div className="ssd-dirty-banner">변경사항이 있습니다. 저장 버튼을 눌러 적용하세요.</div>
      )}

      <div className="ssd-count">{items.length}장 사진</div>

      {loading ? (
        <div className="ssd-skeleton-list">
          {[...Array(4)].map((_, i) => <div key={i} className="ssd-skeleton-row" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="ssd-empty">이 시리즈에 등록된 사진이 없습니다.</div>
      ) : (
        <ul className="ssd-list">
          {items.map((sp, idx) => (
            <li
              key={sp.id}
              ref={el => rowRefs.current[idx] = el}
              className={`ssd-row${dragIdx === idx ? ' dragging' : ''}${overIdx === idx ? ' drag-over' : ''}`}
              draggable
              onDragStart={e => onDragStart(e, idx)}
              onDragOver={e => onDragOver(e, idx)}
              onDrop={e => onDrop(e, idx)}
              onDragEnd={onDragEnd}
            >
              <span className="ssd-grip"><GripVertical size={16} /></span>
              <span className="ssd-num">{idx + 1}</span>
              <BlurImg src={sp.thumbnailUrl} alt={sp.title} />
              <div className="ssd-info">
                <span className="ssd-name">{sp.title}</span>
                <span className="ssd-meta">Photo ID: {sp.photoId}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SortSeriesDetailPage;

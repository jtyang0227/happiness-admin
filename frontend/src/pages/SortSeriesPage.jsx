import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GripVertical, Save, RotateCcw, BookOpen, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApi, putApi } from '../utils/api';
import { useDragSort } from '../hooks/useDragSort';
import './SortSeriesPage.css';

const BlurImg = ({ src, alt }) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <img
      src={src || 'https://picsum.photos/seed/sr/80/60'}
      alt={alt}
      className={`ss-thumb${loaded ? ' loaded' : ''}`}
      onLoad={() => setLoaded(true)}
    />
  );
};

const SortSeriesPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const rowRefs = useRef([]);
  const {
    items, reset, dragIdx, overIdx, isDirty,
    onDragStart, onDragOver, onDrop, onDragEnd, toReorderPayload,
  } = useDragSort([]);

  useEffect(() => {
    getApi('/admin/sort/series')
      .then(data => reset(data))
      .catch(() => toast.error('시리즈 목록을 불러오지 못했습니다.'))
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
      await putApi('/admin/sort/series', toReorderPayload());
      toast.success('시리즈 정렬이 저장되었습니다.');
      reset(items.map((it, idx) => ({ ...it, displayOrder: idx + 1 })));
    } catch {
      toast.error('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    getApi('/admin/sort/series')
      .then(data => { reset(data); toast('정렬을 초기화했습니다.'); })
      .catch(() => toast.error('불러오기 실패'));
  };

  return (
    <div className="ss-page">
      <div className="ss-header">
        <div className="ss-header-left">
          <span className="ss-icon"><BookOpen size={20} /></span>
          <div>
            <h1 className="ss-title">시리즈 정렬 관리</h1>
            <p className="ss-subtitle">드래그로 시리즈 순서를 변경하고 저장하면 앱에 즉시 반영됩니다.</p>
          </div>
        </div>
        <div className="ss-actions">
          {isDirty && (
            <button className="ss-btn ss-btn-ghost" onClick={handleReset}>
              <RotateCcw size={14} /> 초기화
            </button>
          )}
          <button
            className={`ss-btn ss-btn-brand${isDirty ? '' : ' ss-btn-disabled'}`}
            onClick={handleSave}
            disabled={!isDirty || saving}
          >
            <Save size={14} /> {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>

      {isDirty && (
        <div className="ss-dirty-banner">변경사항이 있습니다. 저장 버튼을 눌러 적용하세요.</div>
      )}

      <div className="ss-count">{items.length}개 시리즈</div>

      {loading ? (
        <div className="ss-skeleton-list">
          {[...Array(6)].map((_, i) => <div key={i} className="ss-skeleton-row" />)}
        </div>
      ) : (
        <ul className="ss-list">
          {items.map((series, idx) => (
            <li
              key={series.id}
              ref={el => rowRefs.current[idx] = el}
              className={`ss-row${dragIdx === idx ? ' dragging' : ''}${overIdx === idx ? ' drag-over' : ''}`}
              draggable
              onDragStart={e => onDragStart(e, idx)}
              onDragOver={e => onDragOver(e, idx)}
              onDrop={e => onDrop(e, idx)}
              onDragEnd={onDragEnd}
            >
              <span className="ss-grip"><GripVertical size={16} /></span>
              <span className="ss-num">{idx + 1}</span>
              <BlurImg src={series.coverImageUrl} alt={series.title} />
              <div className="ss-info">
                <span className="ss-name">{series.title}</span>
                <span className="ss-meta">{series.memberName} · 사진 {series.photoCount}장</span>
              </div>
              {series.displayOrder === 0 && (
                <span className="ss-badge ss-badge-unset">미설정</span>
              )}
              <button
                className="ss-detail-btn"
                onClick={e => { e.stopPropagation(); navigate(`/sort/series/${series.id}`); }}
                title="시리즈 내 사진 정렬"
              >
                <ArrowRight size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SortSeriesPage;

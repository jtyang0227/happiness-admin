import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  const [scope, setScope] = useState('all');
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState('');
  const rowRefs = useRef([]);
  const {
    items, reset, dragIdx, overIdx, isDirty,
    onDragStart, onDragOver, onDrop, onDragEnd, toReorderPayload,
  } = useDragSort([]);

  useEffect(() => {
    getApi('/admin/members?size=100&page=0').then(data => setMembers(data.content || []));
  }, []);

  const sortEndpoint = scope === 'member' && selectedMember
    ? `/admin/sort/photos?memberId=${selectedMember}`
    : '/admin/sort/photos';

  const loadPhotos = useCallback(() => {
    if (scope === 'member' && !selectedMember) { reset([]); setLoading(false); return; }
    setLoading(true);
    getApi(sortEndpoint)
      .then(data => reset(data))
      .catch(() => toast.error('사진 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [sortEndpoint, scope, selectedMember]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadPhotos(); }, [loadPhotos]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => e.target.classList.toggle('visible', e.isIntersecting)),
      { threshold: 0.05 }
    );
    rowRefs.current.forEach(r => r && obs.observe(r));
    return () => obs.disconnect();
  }, [items]);

  const buildPayload = () => {
    if (scope === 'all') return toReorderPayload();
    // 작가별 범위: 이 작가가 이미 점유한 전역 displayOrder 값들을 그대로 재사용해
    // 다른 작가의 순서에 영향을 주지 않고 이 작가 내에서만 순서를 바꾼다.
    const values = items.map(it => it.displayOrder).slice().sort((a, b) => a - b);
    return items.map((it, idx) => ({ id: it.id, displayOrder: values[idx] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await putApi('/admin/sort/photos', buildPayload());
      toast.success('사진 정렬이 저장되었습니다.');
      loadPhotos();
    } catch {
      toast.error('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    loadPhotos();
    toast('정렬을 초기화했습니다.');
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

      <div className="sp-scope-row">
        <span className="sp-scope-label">범위</span>
        <label className="sp-scope-radio">
          <input
            type="radio"
            checked={scope === 'all'}
            onChange={() => { if (isDirty) return; setScope('all'); }}
            disabled={isDirty}
          />
          전체 사진
        </label>
        <label className="sp-scope-radio">
          <input
            type="radio"
            checked={scope === 'member'}
            onChange={() => { if (isDirty) return; setScope('member'); }}
            disabled={isDirty}
          />
          작가별
        </label>
        {scope === 'member' && (
          <select
            className="filter-select"
            value={selectedMember}
            onChange={e => { if (isDirty) return; setSelectedMember(e.target.value); }}
            disabled={isDirty}
          >
            <option value="">작가 선택...</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name} ({m.profileName})</option>
            ))}
          </select>
        )}
      </div>

      {isDirty && <div className="sp-dirty-banner">변경사항이 있습니다. 저장 버튼을 눌러 적용하세요.</div>}

      <div className="sp-count">{items.length}개 사진</div>

      {loading ? (
        <div className="sp-skeleton-list">
          {[...Array(8)].map((_, i) => <div key={i} className="sp-skeleton-row" />)}
        </div>
      ) : scope === 'member' && !selectedMember ? (
        <div className="sp-empty">작가를 선택하면 사진 목록이 표시됩니다.</div>
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

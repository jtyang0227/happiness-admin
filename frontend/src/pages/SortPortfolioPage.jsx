import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GripVertical, Save, RotateCcw, ChevronLeft, FolderOpen, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApi, putApi } from '../utils/api';
import { useDragSort } from '../hooks/useDragSort';
import './SortPortfolioPage.css';

const BlurImg = ({ src, alt }) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <img
      src={src || 'https://picsum.photos/seed/pf/80/60'}
      alt={alt}
      className={`spf-thumb${loaded ? ' loaded' : ''}`}
      onLoad={() => setLoaded(true)}
    />
  );
};

const SortPortfolioPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [portfolioTitle, setPortfolioTitle] = useState('');
  const rowRefs = useRef([]);
  const {
    items, reset, dragIdx, overIdx, isDirty,
    onDragStart, onDragOver, onDrop, onDragEnd, toReorderPayload,
  } = useDragSort([]);

  useEffect(() => {
    Promise.all([
      getApi(`/admin/sort/portfolios/${id}/items`),
      getApi(`/admin/portfolios/${id}`),
    ])
      .then(([portItems, portfolio]) => {
        reset(portItems);
        if (portfolio?.title) setPortfolioTitle(portfolio.title);
      })
      .catch(() => {
        getApi(`/admin/sort/portfolios/${id}/items`)
          .then(data => reset(data))
          .catch(() => toast.error('데이터를 불러오지 못했습니다.'));
      })
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
      await putApi(`/admin/sort/portfolios/${id}/items`, toReorderPayload());
      toast.success('포트폴리오 아이템 순서가 저장되었습니다.');
      reset(items.map((it, idx) => ({ ...it, displayOrder: idx + 1 })));
    } catch {
      toast.error('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    getApi(`/admin/sort/portfolios/${id}/items`)
      .then(data => { reset(data); toast('정렬을 초기화했습니다.'); })
      .catch(() => toast.error('불러오기 실패'));
  };

  return (
    <div className="spf-page">
      <div className="spf-breadcrumb">
        <button className="spf-back" onClick={() => navigate('/portfolios')}>
          <ChevronLeft size={16} /> 포트폴리오 목록
        </button>
        <span className="spf-breadcrumb-sep">/</span>
        <span className="spf-breadcrumb-cur">{portfolioTitle || `포트폴리오 #${id}`} — 아이템 정렬</span>
      </div>

      <div className="spf-header">
        <div className="spf-header-left">
          <span className="spf-icon"><FolderOpen size={20} /></span>
          <div>
            <h1 className="spf-title">{portfolioTitle || `포트폴리오 #${id}`} — 아이템 순서</h1>
            <p className="spf-subtitle">포트폴리오 내 사진/시리즈 표시 순서를 드래그로 변경하세요.</p>
          </div>
        </div>
        <div className="spf-actions">
          {isDirty && (
            <button className="spf-btn spf-btn-ghost" onClick={handleReset}>
              <RotateCcw size={14} /> 초기화
            </button>
          )}
          <button
            className={`spf-btn spf-btn-brand${isDirty ? '' : ' spf-btn-disabled'}`}
            onClick={handleSave}
            disabled={!isDirty || saving}
          >
            <Save size={14} /> {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>

      {isDirty && (
        <div className="spf-dirty-banner">변경사항이 있습니다. 저장 버튼을 눌러 적용하세요.</div>
      )}

      <div className="spf-count">{items.length}개 아이템</div>

      {loading ? (
        <div className="spf-skeleton-list">
          {[...Array(4)].map((_, i) => <div key={i} className="spf-skeleton-row" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="spf-empty">이 포트폴리오에 등록된 아이템이 없습니다.</div>
      ) : (
        <ul className="spf-list">
          {items.map((item, idx) => (
            <li
              key={item.id}
              ref={el => rowRefs.current[idx] = el}
              className={`spf-row${dragIdx === idx ? ' dragging' : ''}${overIdx === idx ? ' drag-over' : ''}`}
              draggable
              onDragStart={e => onDragStart(e, idx)}
              onDragOver={e => onDragOver(e, idx)}
              onDrop={e => onDrop(e, idx)}
              onDragEnd={onDragEnd}
            >
              <span className="spf-grip"><GripVertical size={16} /></span>
              <span className="spf-num">{idx + 1}</span>
              <BlurImg src={item.thumbnailUrl} alt={item.title} />
              <div className="spf-info">
                <div className="spf-name-row">
                  <span className="spf-name">{item.title}</span>
                  {item.featured && (
                    <span className="spf-featured"><Star size={10} fill="currentColor" /> 대표</span>
                  )}
                </div>
                <span className="spf-meta">
                  <span className={`spf-type spf-type-${item.itemType?.toLowerCase()}`}>
                    {item.itemType === 'PHOTO' ? '사진' : '시리즈'}
                  </span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SortPortfolioPage;

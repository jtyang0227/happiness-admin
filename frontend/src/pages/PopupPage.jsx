import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Monitor, Smartphone, Globe, Plus, Eye, CalendarClock, Link2, ToggleLeft, ToggleRight, GripVertical, Save } from 'lucide-react';
import { getApi, postApi, putApi, deleteApi, patchApi } from '../utils/api';
import { useConfirm } from '../context/ConfirmContext';
import { useDragSort } from '../hooks/useDragSort';
import './PopupPage.css';

const TARGET_OPTIONS = [
  { value: 'ALL',  label: '전체 화면',  Icon: Globe },
  { value: 'HOME', label: '홈 화면',    Icon: Smartphone },
  { value: 'FEED', label: '피드 화면',  Icon: Monitor },
];

const EMPTY_FORM = {
  title: '', content: '', imageUrl: '', linkUrl: '',
  targetScreen: 'ALL', isActive: true, showOnce: true,
  startsAt: '', endsAt: '',
};

const PopupPage = () => {
  const { confirm } = useConfirm();
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [preview, setPreview] = useState(null);

  const {
    items: popups,
    reset: resetSort,
    isDirty,
    setIsDirty,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    dragIdx,
    overIdx,
    toReorderPayload,
  } = useDragSort([]);

  const fetchData = useCallback(() => {
    setLoading(true);
    getApi('/admin/popups')
      .then(data => resetSort(data))
      .finally(() => setLoading(false));
  }, [resetSort]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const activeCount = popups.filter(p => p.isActive).length;

  const openCreate = () => { setEditId(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit = (p) => {
    setEditId(p.id);
    setForm({
      title: p.title, content: p.content,
      imageUrl: p.imageUrl || '', linkUrl: p.linkUrl || '',
      targetScreen: p.targetScreen,
      isActive: p.isActive, showOnce: p.showOnce,
      startsAt: p.startsAt ? p.startsAt.slice(0, 16) : '',
      endsAt: p.endsAt ? p.endsAt.slice(0, 16) : '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('제목과 내용을 입력해주세요.');
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      startsAt: form.startsAt || null,
      endsAt: form.endsAt || null,
      imageUrl: form.imageUrl || null,
      linkUrl: form.linkUrl || null,
    };
    try {
      if (editId) {
        await putApi(`/admin/popups/${editId}`, payload);
        toast.success('팝업이 수정되었습니다.');
      } else {
        await postApi('/admin/popups', payload);
        toast.success('팝업이 추가되었습니다.');
      }
      setShowForm(false);
      fetchData();
    } catch {
      toast.error('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await patchApi(`/admin/popups/${id}/toggle`, {});
      fetchData();
    } catch {
      toast.error('상태 변경에 실패했습니다.');
    }
  };

  const handleDelete = async (id, title) => {
    const ok = await confirm({ title: '팝업 삭제', description: `"${title}" 팝업을 삭제하시겠습니까?`, variant: 'danger' });
    if (!ok) return;
    try {
      await deleteApi(`/admin/popups/${id}`);
      toast.success('팝업이 삭제되었습니다.');
      fetchData();
    } catch {
      toast.error('삭제에 실패했습니다.');
    }
  };

  const handleSaveOrder = async () => {
    setReordering(true);
    try {
      await patchApi('/admin/popups/reorder', { orderedIds: popups.map(p => p.id) });
      toast.success('노출 순서가 저장되었습니다.');
      setIsDirty(false);
    } catch {
      toast.error('순서 저장에 실패했습니다.');
    } finally {
      setReordering(false);
    }
  };

  const isExpired = (p) => p.endsAt && new Date(p.endsAt) < new Date();
  const isScheduled = (p) => p.startsAt && new Date(p.startsAt) > new Date();

  const getStatusLabel = (p) => {
    if (!p.isActive) return { label: '비활성', cls: 'popup-status-off' };
    if (isExpired(p)) return { label: '종료됨', cls: 'popup-status-expired' };
    if (isScheduled(p)) return { label: '예약됨', cls: 'popup-status-scheduled' };
    return { label: '노출중', cls: 'popup-status-on' };
  };

  return (
    <div className="popup-page">
      <div className="page-header">
        <h1 className="page-title">팝업 관리</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="total-count">활성 <strong>{activeCount}</strong> / 전체 {popups.length}개</span>
          <button className="btn btn-brand btn-md" onClick={openCreate}>
            <Plus size={15} /> 팝업 추가
          </button>
        </div>
      </div>

      {/* API 연동 안내 */}
      <div className="popup-api-hint">
        <code>GET /api/popups/active?screen=HOME</code>
        <span>— happiness-app에서 JWT 없이 호출 가능한 공개 API</span>
      </div>

      {/* 순서 변경 저장 바 */}
      {isDirty && (
        <div className="popup-order-bar">
          <span className="popup-order-bar-msg">노출 순서가 변경되었습니다. 저장하지 않으면 반영되지 않습니다.</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={fetchData}>되돌리기</button>
            <button className="btn btn-brand btn-sm" onClick={handleSaveOrder} disabled={reordering}>
              <Save size={13} /> {reordering ? '저장 중...' : '순서 저장'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-cell">로딩 중...</div>
      ) : popups.length === 0 ? (
        <div className="empty-state">등록된 팝업이 없습니다. 팝업을 추가해 보세요.</div>
      ) : (
        <div className="popup-grid">
          {popups.map((p, idx) => {
            const { label, cls } = getStatusLabel(p);
            const TargetIcon = TARGET_OPTIONS.find(t => t.value === p.targetScreen)?.Icon || Globe;
            return (
              <div
                key={p.id}
                className={[
                  'popup-card',
                  !p.isActive ? 'popup-card--inactive' : '',
                  dragIdx === idx ? 'popup-card--dragging' : '',
                  overIdx === idx && dragIdx !== idx ? 'popup-card--over' : '',
                ].filter(Boolean).join(' ')}
                draggable
                onDragStart={e => onDragStart(e, idx)}
                onDragOver={e => onDragOver(e, idx)}
                onDrop={e => onDrop(e, idx)}
                onDragEnd={onDragEnd}
              >
                <div className="popup-card-header">
                  <div className="popup-card-left">
                    <span className="popup-drag-handle" title="드래그하여 순서 변경">
                      <GripVertical size={15} />
                    </span>
                    <span className="popup-order-num">#{idx + 1}</span>
                    <div className="popup-card-badges">
                      <span className={`popup-status ${cls}`}>{label}</span>
                      <span className="popup-target-badge">
                        <TargetIcon size={11} />
                        {TARGET_OPTIONS.find(t => t.value === p.targetScreen)?.label}
                      </span>
                      {p.showOnce && <span className="popup-once-badge">하루 한 번</span>}
                    </div>
                  </div>
                  <button
                    className={`popup-toggle-btn ${p.isActive ? 'active' : ''}`}
                    onClick={() => handleToggle(p.id)}
                    title={p.isActive ? '비활성화' : '활성화'}
                  >
                    {p.isActive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                  </button>
                </div>

                {p.imageUrl && (
                  <div className="popup-card-img-wrap">
                    <img src={p.imageUrl} alt={p.title} className="popup-card-img"
                      onError={e => { e.target.style.display = 'none'; }} />
                  </div>
                )}

                <div className="popup-card-body">
                  <h3 className="popup-card-title">{p.title}</h3>
                  <p className="popup-card-content">{p.content}</p>
                  {p.linkUrl && (
                    <div className="popup-card-link">
                      <Link2 size={11} /> <span>{p.linkUrl}</span>
                    </div>
                  )}
                </div>

                <div className="popup-card-footer">
                  <div className="popup-card-dates">
                    <CalendarClock size={11} />
                    <span>
                      {p.startsAt ? p.startsAt.slice(0, 10) : '즉시'} ~{' '}
                      {p.endsAt ? p.endsAt.slice(0, 10) : '무기한'}
                    </span>
                  </div>
                  <div className="popup-card-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => setPreview(p)}>
                      <Eye size={13} /> 미리보기
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>수정</button>
                    <button className="btn btn-danger-outline btn-sm" onClick={() => handleDelete(p.id, p.title)}>삭제</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 팝업 미리보기 모달 */}
      {preview && (
        <div className="modal-overlay" onClick={() => setPreview(null)}>
          <div className="popup-preview-wrap" onClick={e => e.stopPropagation()}>
            <div className="popup-preview-phone">
              <div className="popup-preview-screen">
                <div className="popup-preview-box">
                  {preview.imageUrl && (
                    <img src={preview.imageUrl} alt="" className="popup-preview-img" />
                  )}
                  <div className="popup-preview-body">
                    <h4 className="popup-preview-title">{preview.title}</h4>
                    <p className="popup-preview-text">{preview.content}</p>
                  </div>
                  <div className="popup-preview-footer">
                    {preview.showOnce && (
                      <button className="popup-preview-once-btn">오늘 하루 보지 않기</button>
                    )}
                    {preview.linkUrl ? (
                      <button className="popup-preview-confirm-btn">자세히 보기</button>
                    ) : (
                      <button className="popup-preview-confirm-btn" onClick={() => setPreview(null)}>확인</button>
                    )}
                  </div>
                  <button className="popup-preview-close" onClick={() => setPreview(null)}>✕</button>
                </div>
              </div>
            </div>
            <p className="popup-preview-hint">앱에서 표시되는 팝업 미리보기</p>
          </div>
        </div>
      )}

      {/* 생성/수정 폼 모달 */}
      {showForm && (
        <div className="modal-overlay" onClick={() => !saving && setShowForm(false)}>
          <div className="popup-form-dialog" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">{editId ? '팝업 수정' : '새 팝업 추가'}</h3>

            <div className="popup-form-grid">
              <div className="popup-form-group popup-form-full">
                <label className="modal-label">팝업 제목 (내부 관리용)</label>
                <input className="popup-form-input" value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="예: 여름 이벤트 팝업" />
              </div>

              <div className="popup-form-group popup-form-full">
                <label className="modal-label">팝업 내용</label>
                <textarea className="popup-form-textarea" value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="팝업에 표시할 내용을 입력하세요." rows={4} />
              </div>

              <div className="popup-form-group popup-form-full">
                <label className="modal-label">이미지 URL (선택)</label>
                <input className="popup-form-input" value={form.imageUrl}
                  onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                  placeholder="https://..." />
              </div>

              <div className="popup-form-group popup-form-full">
                <label className="modal-label">링크 URL (선택 — 자세히 보기 버튼)</label>
                <input className="popup-form-input" value={form.linkUrl}
                  onChange={e => setForm(f => ({ ...f, linkUrl: e.target.value }))}
                  placeholder="https://..." />
              </div>

              <div className="popup-form-group">
                <label className="modal-label">노출 화면</label>
                <select className="filter-select" style={{ width: '100%' }}
                  value={form.targetScreen}
                  onChange={e => setForm(f => ({ ...f, targetScreen: e.target.value }))}>
                  {TARGET_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div className="popup-form-group">
                <label className="modal-label">노출 시작</label>
                <input type="datetime-local" className="popup-form-input" value={form.startsAt}
                  onChange={e => setForm(f => ({ ...f, startsAt: e.target.value }))} />
              </div>

              <div className="popup-form-group">
                <label className="modal-label">노출 종료 (빈칸 = 무기한)</label>
                <input type="datetime-local" className="popup-form-input" value={form.endsAt}
                  onChange={e => setForm(f => ({ ...f, endsAt: e.target.value }))} />
              </div>

              <div className="popup-form-checks">
                <label className="popup-check-label">
                  <input type="checkbox" checked={form.isActive}
                    onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                  즉시 활성화
                </label>
                <label className="popup-check-label">
                  <input type="checkbox" checked={form.showOnce}
                    onChange={e => setForm(f => ({ ...f, showOnce: e.target.checked }))} />
                  "오늘 하루 보지 않기" 버튼 표시
                </label>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-ghost btn-md" onClick={() => setShowForm(false)} disabled={saving}>취소</button>
              <button className="btn btn-brand btn-md" onClick={handleSave} disabled={saving}>
                {saving ? '저장 중...' : editId ? '수정 완료' : '팝업 추가'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PopupPage;

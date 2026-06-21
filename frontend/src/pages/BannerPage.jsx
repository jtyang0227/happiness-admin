import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getApi, postApi, putApi, deleteApi, patchApi } from '../utils/api';
import { useConfirm } from '../context/ConfirmContext';
import ImgWithFallback from '../components/common/ImgWithFallback';
import './BannerPage.css';

const EMPTY_FORM = { title: '', imageUrl: '', linkUrl: '', isActive: true, startsAt: '', endsAt: '' };

const BannerPage = () => {
  const { confirm } = useConfirm();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    getApi('/admin/banners').then(setBanners).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const activeCount = banners.filter(b => b.isActive).length;

  const openCreate = () => { setEditId(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit = (b) => {
    setEditId(b.id);
    setForm({
      title: b.title, imageUrl: b.imageUrl, linkUrl: b.linkUrl || '',
      isActive: b.isActive,
      startsAt: b.startsAt ? b.startsAt.slice(0, 16) : '',
      endsAt: b.endsAt ? b.endsAt.slice(0, 16) : '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.imageUrl.trim()) {
      toast.error('제목과 이미지 URL을 입력해주세요.');
      return;
    }
    setSaving(true);
    const payload = { ...form, startsAt: form.startsAt || null, endsAt: form.endsAt || null };
    try {
      if (editId) {
        await putApi(`/admin/banners/${editId}`, payload);
        toast.success('배너가 수정되었습니다.');
      } else {
        await postApi('/admin/banners', payload);
        toast.success('배너가 추가되었습니다.');
      }
      setShowForm(false);
      fetchData();
    } catch {
      toast.error('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
    const ok = await confirm({ title: '배너 삭제', description: `"${title}" 배너를 삭제하시겠습니까?`, variant: 'danger' });
    if (!ok) return;
    try {
      await deleteApi(`/admin/banners/${id}`);
      toast.success('배너가 삭제되었습니다.');
      fetchData();
    } catch {
      toast.error('삭제에 실패했습니다.');
    }
  };

  const handleToggle = async (id) => {
    try {
      await patchApi(`/admin/banners/${id}/toggle`, {});
      fetchData();
    } catch {
      toast.error('상태 변경에 실패했습니다.');
    }
  };

  const handleMoveUp = async (index) => {
    if (index === 0) return;
    const newOrder = [...banners];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    try {
      await patchApi('/admin/banners/reorder', { orderedIds: newOrder.map(b => b.id) });
      fetchData();
    } catch {
      toast.error('순서 변경에 실패했습니다.');
    }
  };

  const handleMoveDown = async (index) => {
    if (index === banners.length - 1) return;
    const newOrder = [...banners];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    try {
      await patchApi('/admin/banners/reorder', { orderedIds: newOrder.map(b => b.id) });
      fetchData();
    } catch {
      toast.error('순서 변경에 실패했습니다.');
    }
  };

  return (
    <div className="list-page">
      <div className="page-header">
        <h1 className="page-title">배너 관리</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="total-count">활성: {activeCount}개</span>
          <button className="btn-primary-sm" onClick={openCreate}>+ 배너 추가</button>
        </div>
      </div>

      {loading ? (
        <div className="loading-cell">로딩 중...</div>
      ) : banners.length === 0 ? (
        <div className="empty-state">등록된 배너가 없습니다.</div>
      ) : (
        <div className="banner-list">
          {banners.map((b, idx) => (
            <div key={b.id} className={`banner-item ${!b.isActive ? 'banner-inactive' : ''}`}>
              <div className="banner-order-btns">
                <button className="order-btn" onClick={() => handleMoveUp(idx)} disabled={idx === 0}>▲</button>
                <span className="banner-order-num">#{b.displayOrder}</span>
                <button className="order-btn" onClick={() => handleMoveDown(idx)} disabled={idx === banners.length - 1}>▼</button>
              </div>
              <div className="banner-preview">
                <ImgWithFallback src={b.imageUrl} alt={b.title} className="banner-thumb" />
              </div>
              <div className="banner-info">
                <div className="banner-title">{b.title}</div>
                <div className="banner-meta">
                  {b.linkUrl && <span className="banner-link">{b.linkUrl}</span>}
                  {b.endsAt
                    ? <span>기간: ~{b.endsAt.slice(0, 10)}</span>
                    : <span>기간: 상시</span>
                  }
                </div>
              </div>
              <div className="banner-actions">
                <span className={`badge ${b.isActive ? 'badge-green' : 'badge-gray'}`}>
                  {b.isActive ? '활성' : '비활성'}
                </span>
                <button className="btn-sm btn-warning" onClick={() => handleToggle(b.id)}>
                  {b.isActive ? '비활성화' : '활성화'}
                </button>
                <button className="btn-sm btn-outline" onClick={() => openEdit(b)}>수정</button>
                <button className="btn-sm btn-danger-outline" onClick={() => handleDelete(b.id, b.title)}>삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => !saving && setShowForm(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">{editId ? '배너 수정' : '배너 추가'}</h3>
            <div className="notice-form-group">
              <label className="modal-label">제목</label>
              <input className="notice-title-input" value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="배너 제목" />
            </div>
            <div className="notice-form-group">
              <label className="modal-label">이미지 URL</label>
              <input className="notice-title-input" value={form.imageUrl}
                onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="notice-form-group">
              <label className="modal-label">링크 URL (선택)</label>
              <input className="notice-title-input" value={form.linkUrl}
                onChange={e => setForm(f => ({ ...f, linkUrl: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="banner-form-dates">
              <div className="notice-form-group">
                <label className="modal-label">시작일 (선택)</label>
                <input type="datetime-local" className="notice-title-input" value={form.startsAt}
                  onChange={e => setForm(f => ({ ...f, startsAt: e.target.value }))} />
              </div>
              <div className="notice-form-group">
                <label className="modal-label">종료일 (선택)</label>
                <input type="datetime-local" className="notice-title-input" value={form.endsAt}
                  onChange={e => setForm(f => ({ ...f, endsAt: e.target.value }))} />
              </div>
            </div>
            <label className="notice-pin-label" style={{ marginBottom: '16px' }}>
              <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
              즉시 활성화
            </label>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowForm(false)} disabled={saving}>취소</button>
              <button className="btn-primary-modal" onClick={handleSave} disabled={saving}>
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BannerPage;

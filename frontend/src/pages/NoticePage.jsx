import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getApi, postApi, putApi, deleteApi } from '../utils/api';
import { useConfirm } from '../context/ConfirmContext';
import Pagination from '../components/common/Pagination';
import './NoticePage.css';

const TYPE_LABELS = { '일반': '일반', '점검': '점검', '이벤트': '이벤트', '정책': '정책' };
const STATUS_LABELS = { DRAFT: '임시저장', PUBLISHED: '노출중', EXPIRED: '종료됨' };
const STATUS_CLASSES = { DRAFT: 'badge-yellow', PUBLISHED: 'badge-green', EXPIRED: 'badge-gray' };

const EMPTY_FORM = { type: '일반', title: '', content: '', status: 'PUBLISHED', isPinned: false, expiresAt: '' };

const NoticePage = () => {
  const { confirm } = useConfirm();
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, size: 20 });
    if (status) params.set('status', status);
    if (type) params.set('type', type);
    getApi(`/admin/notices?${params}`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [page, status, type]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => { setEditId(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit = (n) => {
    setEditId(n.id);
    setForm({
      type: n.type, title: n.title, content: n.content,
      status: n.status, isPinned: n.isPinned,
      expiresAt: n.expiresAt ? n.expiresAt.slice(0, 16) : '',
    });
    setShowForm(true);
  };

  const handleSave = async (targetStatus) => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('제목과 내용을 입력해주세요.');
      return;
    }
    setSaving(true);
    const payload = { ...form, status: targetStatus, expiresAt: form.expiresAt || null };
    try {
      if (editId) {
        await putApi(`/admin/notices/${editId}`, payload);
        toast.success('공지사항이 수정되었습니다.');
      } else {
        await postApi('/admin/notices', payload);
        toast.success('공지사항이 저장되었습니다.');
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
    const ok = await confirm({ title: '공지사항 삭제', description: `"${title}"를 삭제하시겠습니까?`, variant: 'danger' });
    if (!ok) return;
    try {
      await deleteApi(`/admin/notices/${id}`);
      toast.success('삭제되었습니다.');
      fetchData();
    } catch {
      toast.error('삭제에 실패했습니다.');
    }
  };

  return (
    <div className="list-page">
      <div className="page-header">
        <h1 className="page-title">공지사항 관리</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="total-count">총 {data.totalElements?.toLocaleString()}건</span>
          <button className="btn-primary-sm" onClick={openCreate}>+ 새 공지 작성</button>
        </div>
      </div>

      <div className="filter-bar">
        <select className="filter-select" value={status} onChange={e => { setStatus(e.target.value); setPage(0); }}>
          <option value="">전체 상태</option>
          <option value="PUBLISHED">노출중</option>
          <option value="DRAFT">임시저장</option>
          <option value="EXPIRED">종료됨</option>
        </select>
        <select className="filter-select" value={type} onChange={e => { setType(e.target.value); setPage(0); }}>
          <option value="">전체 유형</option>
          <option value="일반">일반</option>
          <option value="점검">점검</option>
          <option value="이벤트">이벤트</option>
          <option value="정책">정책</option>
        </select>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr><th>고정</th><th>유형</th><th>제목</th><th>상태</th><th>노출 종료</th><th>작성일</th><th>관리</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="loading-cell">로딩 중...</td></tr>
            ) : data.content.length === 0 ? (
              <tr><td colSpan="7" className="loading-cell">공지사항이 없습니다.</td></tr>
            ) : data.content.map(n => (
              <tr key={n.id} className={n.isPinned ? 'row-pinned' : ''}>
                <td>{n.isPinned ? '📌' : ''}</td>
                <td><span className="notice-type-badge">{TYPE_LABELS[n.type] || n.type}</span></td>
                <td className="name-cell">{n.title}</td>
                <td><span className={`badge ${STATUS_CLASSES[n.status] || 'badge-gray'}`}>{STATUS_LABELS[n.status] || n.status}</span></td>
                <td>{n.expiresAt ? n.expiresAt.slice(0, 10) : '무기한'}</td>
                <td>{n.createdAt?.slice(0, 10)}</td>
                <td>
                  <div className="action-cell">
                    <button className="btn-sm btn-outline" onClick={() => openEdit(n)}>수정</button>
                    <button className="btn-sm btn-danger-outline" onClick={() => handleDelete(n.id, n.title)}>삭제</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />

      {showForm && (
        <div className="modal-overlay" onClick={() => !saving && setShowForm(false)}>
          <div className="notice-form-dialog" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">{editId ? '공지사항 수정' : '새 공지 작성'}</h3>
            <div className="notice-form-row">
              <div className="notice-form-group">
                <label className="modal-label">유형</label>
                <select className="filter-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="일반">일반</option>
                  <option value="점검">점검</option>
                  <option value="이벤트">이벤트</option>
                  <option value="정책">정책</option>
                </select>
              </div>
              <label className="notice-pin-label">
                <input type="checkbox" checked={form.isPinned} onChange={e => setForm(f => ({ ...f, isPinned: e.target.checked }))} />
                상단 고정
              </label>
            </div>
            <div className="notice-form-group">
              <label className="modal-label">제목</label>
              <input
                className="notice-title-input"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="공지 제목을 입력하세요"
              />
            </div>
            <div className="notice-form-group">
              <label className="modal-label">내용</label>
              <textarea
                className="notice-content-textarea"
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="공지 내용을 입력하세요..."
                rows={8}
              />
            </div>
            <div className="notice-form-group">
              <label className="modal-label">노출 종료 (빈칸 = 무기한)</label>
              <input
                type="datetime-local"
                className="notice-title-input"
                value={form.expiresAt}
                onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
              />
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowForm(false)} disabled={saving}>취소</button>
              <button className="btn-secondary" onClick={() => handleSave('DRAFT')} disabled={saving}>임시저장</button>
              <button className="btn-primary-modal" onClick={() => handleSave('PUBLISHED')} disabled={saving}>
                {saving ? '저장 중...' : '발행하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoticePage;

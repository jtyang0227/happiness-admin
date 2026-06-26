import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShieldCheck } from 'lucide-react';
import { getApi, patchApi, deleteApi } from '../utils/api';
import { useConfirm } from '../context/ConfirmContext';
import Pagination from '../components/common/Pagination';
import './MemberListPage.css';

const AUTHORITY_COLORS = { WM: 'badge-purple', SA: 'badge-blue', US: 'badge-green' };
const STATUS_COLORS = {
  ACTIVE: 'badge-green',
  INACTIVE: 'badge-yellow',
  SUSPENDED: 'badge-red',
  DELETED: 'badge-gray',
};
const STATUS_LABELS = { ACTIVE: '활성', INACTIVE: '비활성', SUSPENDED: '정지', DELETED: '삭제됨' };

const SuspendModal = ({ member, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');
  const [days, setDays] = useState(7);
  const overlayRef = useRef(null);

  useEffect(() => {
    const handleKey = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={e => { if (e.target === overlayRef.current) onClose(); }}>
      <div className="modal-dialog">
        <div className="modal-icon modal-icon--warning">⚠️</div>
        <div className="modal-title">회원 정지</div>
        <div className="modal-desc">"{member.name}" 회원을 정지 처리합니다.</div>
        <div style={{ width: '100%', marginTop: 12 }}>
          <div className="modal-label">정지 기간</div>
          <div className="suspend-chips">
            {[{ v: 3, l: '3일' }, { v: 7, l: '7일' }, { v: 30, l: '30일' }, { v: 0, l: '영구' }].map(({ v, l }) => (
              <button
                key={v}
                className={`period-chip${days === v ? ' selected' : ''}`}
                onClick={() => setDays(v)}
              >{l}</button>
            ))}
          </div>
          <div className="modal-label" style={{ marginTop: 12 }}>정지 사유</div>
          <textarea
            className="modal-textarea"
            rows={3}
            placeholder="정지 사유를 입력하세요"
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost btn-md" onClick={onClose}>취소</button>
          <button
            className="btn btn-danger-full btn-md"
            onClick={() => onConfirm(reason, days)}
            disabled={!reason.trim()}
          >정지 적용</button>
        </div>
      </div>
    </div>
  );
};

const MemberListPage = () => {
  const { confirm } = useConfirm();
  const navigate = useNavigate();
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [search, setSearch] = useState('');
  const [authority, setAuthority] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [suspendTarget, setSuspendTarget] = useState(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, size: 20 });
    if (search) params.set('search', search);
    if (authority) params.set('authority', authority);
    if (status) params.set('status', status);
    getApi(`/admin/members?${params}`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [page, search, authority, status]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRoleChange = async (id, name, newAuthority) => {
    const LABELS = { WM: '웹관리자', SA: '운영자', US: '일반 회원' };
    const ok = await confirm({
      title: '역할 변경',
      description: `"${name}"의 역할을 ${LABELS[newAuthority]}(${newAuthority})로 변경하시겠습니까?`,
      variant: 'warning',
    });
    if (!ok) { fetchData(); return; }
    try {
      await patchApi(`/admin/members/${id}/role`, { authority: newAuthority });
      toast.success('역할이 변경되었습니다.');
      fetchData();
    } catch {
      toast.error('역할 변경에 실패했습니다.');
      fetchData();
    }
  };

  const handleSuspendConfirm = async (reason, suspendDays) => {
    const { id, name } = suspendTarget;
    setSuspendTarget(null);
    try {
      await patchApi(`/admin/members/${id}/status`, {
        status: 'SUSPENDED',
        reason,
        suspendDays: suspendDays || null,
      });
      toast.success(`"${name}" 회원이 정지되었습니다.`);
      fetchData();
    } catch {
      toast.error('정지 처리에 실패했습니다.');
    }
  };

  const handleActivate = async (id, name) => {
    const ok = await confirm({
      title: '정지 해제',
      description: `"${name}" 회원의 정지를 해제하시겠습니까?`,
      variant: 'warning',
    });
    if (!ok) return;
    try {
      await patchApi(`/admin/members/${id}/status`, { status: 'ACTIVE' });
      toast.success('정지가 해제되었습니다.');
      fetchData();
    } catch {
      toast.error('정지 해제에 실패했습니다.');
    }
  };

  const handleDelete = async (id, name) => {
    const ok = await confirm({
      title: '회원 삭제',
      description: `"${name}" 회원을 삭제합니다.\n사진, 시리즈, 문의가 함께 삭제됩니다.`,
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteApi(`/admin/members/${id}`);
      toast.success('회원이 삭제되었습니다.');
      fetchData();
    } catch {
      toast.error('삭제에 실패했습니다.');
    }
  };

  return (
    <div className="list-page">
      <div className="page-header">
        <h1 className="page-title">회원 관리</h1>
        <span className="total-count">총 {data.totalElements?.toLocaleString()}명</span>
      </div>

      <div className="filter-bar">
        <input
          className="search-input"
          placeholder="이름 또는 이메일 검색"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
        />
        <select className="filter-select" value={authority} onChange={e => { setAuthority(e.target.value); setPage(0); }}>
          <option value="">전체 역할</option>
          <option value="WM">웹관리자</option>
          <option value="SA">운영자</option>
          <option value="US">일반</option>
        </select>
        <select className="filter-select" value={status} onChange={e => { setStatus(e.target.value); setPage(0); }}>
          <option value="">전체 상태</option>
          <option value="ACTIVE">활성</option>
          <option value="INACTIVE">비활성</option>
          <option value="SUSPENDED">정지</option>
        </select>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>이름</th>
              <th>이메일</th>
              <th>프로필</th>
              <th>역할</th>
              <th>상태</th>
              <th>사진</th>
              <th>가입일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="loading-cell">로딩 중...</td></tr>
            ) : data.content.map(m => (
              <tr key={m.id}>
                <td className="name-cell">
                  <button className="member-name-link" onClick={() => navigate(`/members/${m.id}`)}>
                    {m.name}
                    {m.isVerified && <ShieldCheck size={13} className="verified-icon" />}
                  </button>
                </td>
                <td>{m.email}</td>
                <td>{m.profileName || '-'}</td>
                <td>
                  <select
                    className={`role-select badge ${AUTHORITY_COLORS[m.authority]}`}
                    value={m.authority}
                    onChange={e => handleRoleChange(m.id, m.name, e.target.value)}
                  >
                    <option value="WM">웹관리자</option>
                    <option value="SA">운영자</option>
                    <option value="US">일반</option>
                  </select>
                </td>
                <td>
                  <span className={`badge ${STATUS_COLORS[m.status]}`}>
                    {STATUS_LABELS[m.status]}
                  </span>
                </td>
                <td>{m.photoCount}</td>
                <td>{m.createdAt?.slice(0, 10)}</td>
                <td className="action-cell">
                  {m.status === 'SUSPENDED' ? (
                    <button className="btn btn-warning btn-sm" onClick={() => handleActivate(m.id, m.name)}>해제</button>
                  ) : m.status === 'ACTIVE' ? (
                    <button className="btn btn-outline btn-sm" onClick={() => setSuspendTarget(m)}>정지</button>
                  ) : null}
                  <button className="btn btn-danger-outline btn-sm" onClick={() => handleDelete(m.id, m.name)}>삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />

      {suspendTarget && (
        <SuspendModal
          member={suspendTarget}
          onClose={() => setSuspendTarget(null)}
          onConfirm={handleSuspendConfirm}
        />
      )}
    </div>
  );
};

export default MemberListPage;

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, ShieldCheck, Users } from 'lucide-react';
import { getApi, patchApi, deleteApi } from '../utils/api';
import { useConfirm } from '../context/ConfirmContext';
import Pagination from '../components/common/Pagination';
import './MemberListPage.css';

const AUTHORITY_COLORS = { WM: 'badge-purple', SA: 'badge-blue', US: 'badge-green' };
const AUTHORITY_LABELS = { WM: '웹관리자', SA: '운영자', US: '일반' };
const STATUS_COLORS = { ACTIVE: 'badge-green', INACTIVE: 'badge-yellow', SUSPENDED: 'badge-red', DELETED: 'badge-draft' };
const STATUS_LABELS = { ACTIVE: '활성', INACTIVE: '비활성', SUSPENDED: '정지', DELETED: '삭제됨' };

const AVATAR_COLORS = [
  '#E60023', '#2563eb', '#7c3aed', '#059669', '#d97706', '#0891b2', '#be185d',
];
const avatarColor = (name = '') => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const SuspendModal = ({ member, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');
  const [days, setDays] = useState(7);
  const overlayRef = useRef(null);

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = ''; };
  }, [onClose]);

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={e => e.target === overlayRef.current && onClose()}>
      <div className="modal-dialog">
        <div className="modal-icon modal-icon--warning">⚠️</div>
        <div className="modal-title">회원 정지</div>
        <div className="modal-desc">
          <strong>{member.name}</strong> 님을 정지 처리합니다.
        </div>
        <div className="modal-field-group">
          <div className="modal-label">정지 기간</div>
          <div className="period-chips">
            {[{ v: 3, l: '3일' }, { v: 7, l: '7일' }, { v: 30, l: '30일' }, { v: 0, l: '영구' }].map(({ v, l }) => (
              <button key={v} className={`period-chip${days === v ? ' selected' : ''}`} onClick={() => setDays(v)}>{l}</button>
            ))}
          </div>
          <div className="modal-label" style={{ marginTop: 14 }}>정지 사유 <span className="modal-required">*</span></div>
          <textarea
            className="modal-textarea"
            rows={3}
            placeholder="운영 정책 위반 내용을 입력하세요"
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
        </div>
        <div className="modal-actions">
          <button className="btn btn-ghost btn-md" onClick={onClose}>취소</button>
          <button className="btn btn-danger-full btn-md" onClick={() => onConfirm(reason, days)} disabled={!reason.trim()}>
            정지 적용
          </button>
        </div>
      </div>
    </div>
  );
};

const TableRow = ({ m, onNavigate, onRoleChange, onSuspend, onActivate, onDelete }) => {
  const rowRef = useRef(null);
  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('row-visible'); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <tr ref={rowRef} className="member-row">
      <td>
        <button className="member-name-btn" onClick={() => onNavigate(m.id)}>
          <span className="member-avatar" style={{ background: avatarColor(m.name) }}>
            {m.name?.charAt(0).toUpperCase()}
          </span>
          <span className="member-name-text">
            {m.name}
            {m.isVerified && <ShieldCheck size={12} className="verified-icon" />}
          </span>
        </button>
      </td>
      <td className="email-cell">{m.email}</td>
      <td className="profile-cell">{m.profileName ? `@${m.profileName}` : <span className="text-muted">—</span>}</td>
      <td>
        <select
          className={`role-select badge ${AUTHORITY_COLORS[m.authority]}`}
          value={m.authority}
          onChange={e => onRoleChange(m.id, m.name, e.target.value)}
        >
          {Object.entries(AUTHORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </td>
      <td>
        <span className={`badge ${STATUS_COLORS[m.status] || 'badge-draft'}`}>
          {STATUS_LABELS[m.status]}
        </span>
      </td>
      <td className="num-cell">{m.photoCount.toLocaleString()}</td>
      <td className="date-cell">{m.createdAt?.slice(0, 10)}</td>
      <td className="action-cell">
        {m.status === 'SUSPENDED'
          ? <button className="btn btn-warning btn-sm" onClick={() => onActivate(m.id, m.name)}>해제</button>
          : m.status === 'ACTIVE'
            ? <button className="btn btn-outline btn-sm" onClick={() => onSuspend(m)}>정지</button>
            : null}
        <button className="btn btn-danger-outline btn-sm" onClick={() => onDelete(m.id, m.name)}>삭제</button>
      </td>
    </tr>
  );
};

const StatusChip = ({ value, label, active, onClick }) => (
  <button className={`status-filter-chip${active ? ' active' : ''}`} onClick={onClick}>
    {label}
  </button>
);

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
    getApi(`/admin/members?${params}`).then(setData).finally(() => setLoading(false));
  }, [page, search, authority, status]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRoleChange = async (id, name, newAuth) => {
    const ok = await confirm({
      title: '역할 변경',
      description: `"${name}"의 역할을 ${AUTHORITY_LABELS[newAuth]}(${newAuth})로 변경하시겠습니까?`,
      variant: 'warning',
    });
    if (!ok) { fetchData(); return; }
    try {
      await patchApi(`/admin/members/${id}/role`, { authority: newAuth });
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
      await patchApi(`/admin/members/${id}/status`, { status: 'SUSPENDED', reason, suspendDays: suspendDays || null });
      toast.success(`"${name}" 회원이 정지되었습니다.`);
      fetchData();
    } catch {
      toast.error('정지 처리에 실패했습니다.');
    }
  };

  const handleActivate = async (id, name) => {
    const ok = await confirm({ title: '정지 해제', description: `"${name}" 회원의 정지를 해제하시겠습니까?`, variant: 'warning' });
    if (!ok) return;
    try {
      await patchApi(`/admin/members/${id}/status`, { status: 'ACTIVE' });
      toast.success('정지가 해제되었습니다.');
      fetchData();
    } catch {
      toast.error('처리에 실패했습니다.');
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

  const STATUS_CHIPS = [
    { value: '', label: '전체' },
    { value: 'ACTIVE', label: '활성' },
    { value: 'INACTIVE', label: '비활성' },
    { value: 'SUSPENDED', label: '정지' },
  ];

  return (
    <div className="member-list-page">
      {/* 헤더 */}
      <div className="ml-page-header">
        <div className="ml-title-row">
          <div className="ml-title-icon"><Users size={20} /></div>
          <h1 className="ml-title">회원 관리</h1>
          <span className="ml-total">{data.totalElements?.toLocaleString()}명</span>
        </div>
      </div>

      {/* 필터 바 */}
      <div className="ml-filter-section">
        <div className="ml-search-wrap">
          <Search size={15} className="ml-search-icon" />
          <input
            className="ml-search-input"
            placeholder="이름 또는 이메일 검색"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
        <div className="ml-filter-right">
          <div className="status-chips">
            {STATUS_CHIPS.map(c => (
              <StatusChip key={c.value} value={c.value} label={c.label} active={status === c.value}
                onClick={() => { setStatus(c.value); setPage(0); }} />
            ))}
          </div>
          <select className="filter-select ml-authority-select" value={authority}
            onChange={e => { setAuthority(e.target.value); setPage(0); }}>
            <option value="">전체 역할</option>
            <option value="WM">웹관리자</option>
            <option value="SA">운영자</option>
            <option value="US">일반</option>
          </select>
        </div>
      </div>

      {/* 테이블 */}
      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>회원</th>
              <th>이메일</th>
              <th>프로필명</th>
              <th>역할</th>
              <th>상태</th>
              <th>사진</th>
              <th>가입일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <td key={j}><div className="skeleton" style={{ height: 16, width: j === 0 ? 140 : 80, borderRadius: 4 }} /></td>
                  ))}
                </tr>
              ))
              : data.content.length === 0
                ? <tr><td colSpan="8"><div className="ml-empty">검색 결과가 없습니다.</div></td></tr>
                : data.content.map(m => (
                  <TableRow
                    key={m.id}
                    m={m}
                    onNavigate={id => navigate(`/members/${id}`)}
                    onRoleChange={handleRoleChange}
                    onSuspend={setSuspendTarget}
                    onActivate={handleActivate}
                    onDelete={handleDelete}
                  />
                ))
            }
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />

      {suspendTarget && (
        <SuspendModal member={suspendTarget} onClose={() => setSuspendTarget(null)} onConfirm={handleSuspendConfirm} />
      )}
    </div>
  );
};

export default MemberListPage;

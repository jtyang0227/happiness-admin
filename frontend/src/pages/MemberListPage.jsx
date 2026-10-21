import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, ShieldCheck, Users, Download } from 'lucide-react';
import { getApi, patchApi, deleteApi, postApi } from '../utils/api';
import { useConfirm } from '../context/ConfirmContext';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/common/Pagination';
import SegmentedControl from '../components/common/SegmentedControl';
import './MemberListPage.css';

const AUTHORITY_COLORS = { WM: 'badge-purple', SA: 'badge-blue', US: 'badge-green' };
const AUTHORITY_LABELS = { WM: '웹관리자', SA: '운영자', US: '일반' };
const STATUS_COLORS = { ACTIVE: 'badge-green', INACTIVE: 'badge-yellow', SUSPENDED: 'badge-red', DELETED: 'badge-draft' };
const STATUS_LABELS = { ACTIVE: '활성', INACTIVE: '비활성', SUSPENDED: '정지', DELETED: '탈퇴' };

const daysLeft = (iso) => Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));
const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

const AVATAR_COLORS = [
  '#EC572D', '#2F7A8C', '#6A5B8C', '#3F8A57', '#B8791E', '#2C4E6E', '#A82530',
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

const TableRow = ({ m, me, onNavigate, onRoleChange, onSuspend, onActivate, onWithdraw, onRestore, onDelete }) => {
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

  const isSelf = me?.memberId === m.id || me?.email === m.email;
  const isWm = me?.authority === 'WM';
  const targetIsAdmin = m.authority === 'WM' || m.authority === 'SA';
  const canRestrict = !isSelf && (!targetIsAdmin || isWm);

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
            {isSelf && <span className="ml-self-tag">나</span>}
          </span>
        </button>
      </td>
      <td className="email-cell">{m.email}</td>
      <td className="profile-cell">{m.profileName ? `@${m.profileName}` : <span className="text-muted">—</span>}</td>
      <td>
        <select
          className={`role-select badge ${AUTHORITY_COLORS[m.authority]}`}
          value={m.authority}
          disabled={isSelf || !isWm}
          title={isSelf ? '본인 역할은 바꿀 수 없습니다' : !isWm ? '역할 변경은 웹관리자만 할 수 있습니다' : undefined}
          onChange={e => onRoleChange(m.id, m.name, e.target.value)}
        >
          {Object.entries(AUTHORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </td>
      <td>
        <span className={`badge ${STATUS_COLORS[m.status] || 'badge-draft'}`}>
          {STATUS_LABELS[m.status]}
        </span>
        {m.status === 'SUSPENDED' && (
          <div className="ml-suspend-left">{m.suspendUntil ? `${daysLeft(m.suspendUntil)}일 후 자동 해제` : '영구 정지'}</div>
        )}
      </td>
      <td className="num-cell">{m.photoCount.toLocaleString()}</td>
      <td className="date-cell">{m.createdAt?.slice(0, 10)}</td>
      <td className="action-cell">
        {isSelf ? <span className="text-muted">—</span> : m.status === 'DELETED' ? (
          <>
            <button className="btn btn-outline btn-sm" onClick={() => onRestore(m)}>복구</button>
            {isWm && <button className="btn btn-danger-outline btn-sm" onClick={() => onDelete(m)}>영구 삭제</button>}
          </>
        ) : (
          <>
            {m.status === 'SUSPENDED' && <button className="btn btn-warning btn-sm" onClick={() => onActivate(m)}>해제</button>}
            {m.status === 'ACTIVE' && canRestrict && <button className="btn btn-outline btn-sm" onClick={() => onSuspend(m)}>정지</button>}
            {canRestrict && <button className="btn btn-danger-outline btn-sm" onClick={() => onWithdraw(m)}>탈퇴</button>}
          </>
        )}
      </td>
    </tr>
  );
};

const MemberListPage = () => {
  const { confirm } = useConfirm();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [summary, setSummary] = useState(null);
  const [search, setSearch] = useState('');
  const [authority, setAuthority] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [suspendTarget, setSuspendTarget] = useState(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, size: 20 });
    if (search) params.set('search', search);
    if (authority) params.set('authority', authority);
    if (status) params.set('status', status);
    getApi(`/admin/members?${params}`).then(setData).finally(() => setLoading(false));
    getApi('/admin/members/summary').then(setSummary).catch(() => {});
  }, [page, search, authority, status]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const run = async (request, successMsg) => {
    try {
      await request();
      toast.success(successMsg);
    } catch (e) {
      toast.error(e.message || '처리에 실패했습니다.');
    } finally {
      fetchData();
    }
  };

  const handleRoleChange = async (id, name, newAuth) => {
    const ok = await confirm({
      title: '역할 변경',
      description: `"${name}"의 역할을 ${AUTHORITY_LABELS[newAuth]}(${newAuth})로 변경하시겠습니까?`,
      variant: 'warning',
    });
    if (!ok) { fetchData(); return; }
    run(() => patchApi(`/admin/members/${id}/role`, { authority: newAuth }), '역할이 변경되었습니다.');
  };

  const handleSuspendConfirm = (reason, suspendDays) => {
    const { id, name } = suspendTarget;
    setSuspendTarget(null);
    run(() => patchApi(`/admin/members/${id}/status`, { status: 'SUSPENDED', reason, suspendDays: suspendDays || null }),
      `"${name}" 회원이 정지되었습니다.`);
  };

  const handleActivate = async (m) => {
    const ok = await confirm({ title: '정지 해제', description: `"${m.name}" 회원의 정지를 해제하시겠습니까?`, variant: 'warning' });
    if (ok) run(() => patchApi(`/admin/members/${m.id}/status`, { status: 'ACTIVE' }), '정지가 해제되었습니다.');
  };

  const handleWithdraw = async (m) => {
    const ok = await confirm({
      title: '탈퇴 처리',
      description: `"${m.name}" 회원을 탈퇴 처리합니다. 데이터는 보존되며 언제든 복구할 수 있습니다.`,
      variant: 'danger',
    });
    if (ok) run(() => patchApi(`/admin/members/${m.id}/status`, { status: 'DELETED' }), '탈퇴 처리되었습니다.');
  };

  const handleRestore = async (m) => {
    const ok = await confirm({ title: '회원 복구', description: `"${m.name}" 회원을 활성 상태로 복구합니다.`, variant: 'warning' });
    if (ok) run(() => patchApi(`/admin/members/${m.id}/status`, { status: 'ACTIVE' }), '복구되었습니다.');
  };

  const handleDelete = async (m) => {
    const ok = await confirm({
      title: '영구 삭제',
      description: `"${m.name}" 회원과 사진·시리즈·포트폴리오·예약·문의·댓글·프로필 콘텐츠를 영구 삭제합니다. 되돌릴 수 없습니다.`,
      variant: 'danger',
    });
    if (ok) run(() => deleteApi(`/admin/members/${m.id}`), '영구 삭제되었습니다.');
  };

  const handleExport = async () => {
    const ok = await confirm({
      title: '회원 CSV 내보내기',
      description: `현재 필터 결과 ${data.totalElements.toLocaleString()}명(최대 5,000명)을 내려받습니다. 연락처는 포함되지 않으며, 내보내기 기록은 활동 로그에 남습니다.`,
      variant: 'warning',
    });
    if (!ok) return;
    setExporting(true);
    try {
      const rows = await postApi('/admin/members/export', { search, authority, status });
      const header = 'id,name,email,profile_name,authority,status,verified,created_at';
      const lines = rows.map(r => [r.id, r.name, r.email, r.profileName, r.authority, r.status, r.verified, r.createdAt].map(csvCell).join(','));
      const url = URL.createObjectURL(new Blob([`\uFEFF${[header, ...lines].join('\n')}`], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `members-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${rows.length}명을 내보냈습니다.`);
    } catch (e) {
      toast.error(e.message || '내보내기에 실패했습니다.');
    } finally {
      setExporting(false);
    }
  };

  const pickStatus = (v) => { setStatus(v); setPage(0); };
  const SUMMARY_CARDS = [
    { key: '', label: '전체 회원', value: summary?.total },
    { key: 'ACTIVE', label: '활성', value: summary?.ACTIVE },
    { key: 'SUSPENDED', label: '정지', value: summary?.SUSPENDED,
      sub: summary?.suspensionsEnding3d ? `3일 내 자동 해제 ${summary.suspensionsEnding3d}명` : null },
    { key: 'DELETED', label: '탈퇴', value: summary?.DELETED },
    { key: null, label: '7일 신규 가입', value: summary?.new7d },
  ];

  return (
    <div className="member-list-page">
      {/* 헤더 */}
      <div className="ml-page-header">
        <div className="ml-title-row">
          <div className="ml-title-icon"><Users size={20} /></div>
          <h1 className="ml-title">회원 관리</h1>
          <span className="ml-total">{data.totalElements?.toLocaleString()}명</span>
          <button type="button" className="btn btn-md btn-primary ml-export" onClick={handleExport} disabled={exporting || !data.totalElements}>
            <Download size={14} /> {exporting ? '내보내는 중...' : 'CSV 내보내기'}
          </button>
        </div>
      </div>

      <div className="ml-summary">
        {SUMMARY_CARDS.map(c => {
          const clickable = c.key !== null;
          const Tag = clickable ? 'button' : 'div';
          return (
            <Tag
              key={c.label}
              type={clickable ? 'button' : undefined}
              className={`ml-summary-card${clickable ? ' ml-summary-card--clickable' : ''}${clickable && status === c.key ? ' active' : ''}`}
              onClick={clickable ? () => pickStatus(c.key) : undefined}
            >
              <span className="ml-summary-value">{c.value?.toLocaleString() ?? '-'}</span>
              <span className="ml-summary-label">{c.label}</span>
              {c.sub && <span className="ml-summary-sub">{c.sub}</span>}
            </Tag>
          );
        })}
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
          <SegmentedControl
            ariaLabel="회원 상태"
            value={status}
            onChange={pickStatus}
            options={[{ value: '', label: '전체' }, ...['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED'].map(k => ({ value: k, label: STATUS_LABELS[k] }))]}
          />
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
                    me={user}
                    onSuspend={setSuspendTarget}
                    onActivate={handleActivate}
                    onWithdraw={handleWithdraw}
                    onRestore={handleRestore}
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

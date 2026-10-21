import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, ShieldCheck, Camera, BookOpen,
  MessageSquare, FolderOpen, Calendar, Phone, Mail, StickyNote, History, ShieldAlert, Trash2, IdCard,
} from 'lucide-react';
import { getApi, patchApi, postApi, deleteApi } from '../utils/api';
import { useConfirm } from '../context/ConfirmContext';
import { useAuth } from '../context/AuthContext';
import SlideOver from '../components/common/SlideOver';
import './MemberDetailPage.css';

const TABS = [
  { key: 'summary', label: '활동 요약' },
  { key: 'photos',  label: '사진' },
  { key: 'series',  label: '시리즈' },
  { key: 'portfolios', label: '포트폴리오' },
  { key: 'inquiries', label: '문의' },
  { key: 'comments', label: '댓글' },
  { key: 'security', label: '보안 기록' },
  { key: 'manage', label: '관리 이력·메모' },
];

const AUTHORITY_LABELS = { WM: '웹관리자', SA: '운영자', US: '일반' };
const PF_STATUS_LABELS = { DRAFT: '임시저장', PENDING: '심사 중', APPROVED: '승인', REJECTED: '반려' };
const PF_STATUS_BADGE = { DRAFT: 'badge-draft', PENDING: 'badge-pending', APPROVED: 'badge-approved', REJECTED: 'badge-rejected' };

const STATUS_MAP = {
  ACTIVE:    { label: '활성',   cls: 'sc-active' },
  INACTIVE:  { label: '비활성', cls: 'sc-inactive' },
  SUSPENDED: { label: '정지',   cls: 'sc-suspended' },
  DELETED:   { label: '탈퇴', cls: 'sc-deleted' },
};

const AVATAR_COLORS = ['#EC572D','#2F7A8C','#6A5B8C','#3F8A57','#B8791E','#2C4E6E','#A82530'];
const avatarColor = (name = '') => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

/* ── 정지 모달 ── */
const SuspendModal = ({ member, onClose, onConfirm }) => {
  const [reason, setReason] = useState(member.suspendReason || '');
  const [days, setDays] = useState(7);
  const overlayRef = useRef(null);

  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [onClose]);

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={e => e.target === overlayRef.current && onClose()}>
      <div className="modal-dialog">
        <div className="modal-icon modal-icon--warning">⚠️</div>
        <div className="modal-title">회원 정지</div>
        <div className="modal-desc"><strong>{member.name}</strong> 님을 정지 처리합니다.</div>
        <div style={{ width: '100%', marginTop: 16 }}>
          <div className="modal-label">정지 기간</div>
          <div className="period-chips">
            {[{ v: 3, l: '3일' },{ v: 7, l: '7일' },{ v: 30, l: '30일' },{ v: 0, l: '영구' }].map(({ v, l }) => (
              <button key={v} className={`period-chip${days === v ? ' selected' : ''}`} onClick={() => setDays(v)}>{l}</button>
            ))}
          </div>
          <div className="modal-label" style={{ marginTop: 14 }}>정지 사유 <span style={{ color: 'var(--color-danger)', fontSize: 11 }}>*</span></div>
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

/* ── KPI 카드 ── */
const KpiCard = ({ icon: Icon, label, value, color, delay = 0 }) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.style.transitionDelay = `${delay}ms`; el.classList.add('kpi-visible'); obs.disconnect(); } }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className="kpi-card">
      <div className="kpi-icon" style={{ '--kpi-color': color }}>
        <Icon size={20} />
      </div>
      <div className="kpi-body">
        <div className="kpi-value">{(value ?? 0).toLocaleString()}</div>
        <div className="kpi-label">{label}</div>
      </div>
    </div>
  );
};

/* ── 사진 썸네일 (blur reveal) ── */
const PhotoThumb = ({ photo }) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="mdp-photo-card">
      <div className="mdp-photo-img-wrap">
        {photo.thumbnailUrl
          ? <img
              src={photo.thumbnailUrl}
              alt={photo.title}
              className={`mdp-photo-img${loaded ? ' loaded' : ''}`}
              onLoad={() => setLoaded(true)}
            />
          : <div className="mdp-photo-placeholder"><Camera size={24} /></div>
        }
      </div>
      <div className="mdp-photo-title">{photo.title || '제목 없음'}</div>
    </div>
  );
};

/* ── 포트폴리오 썸네일 (blur reveal) ── */
const PortfolioThumb = ({ portfolio, onClick }) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="mdp-photo-card" style={{ cursor: 'pointer' }} onClick={onClick}>
      <div className="mdp-photo-img-wrap">
        {portfolio.coverImageUrl
          ? <img
              src={portfolio.coverImageUrl}
              alt={portfolio.title}
              className={`mdp-photo-img${loaded ? ' loaded' : ''}`}
              onLoad={() => setLoaded(true)}
            />
          : <div className="mdp-photo-placeholder"><FolderOpen size={24} /></div>
        }
      </div>
      <div className="mdp-photo-title">{portfolio.title}</div>
      <span className={`badge ${PF_STATUS_BADGE[portfolio.status] || ''}`} style={{ marginTop: 4 }}>
        {PF_STATUS_LABELS[portfolio.status] || portfolio.status}
      </span>
    </div>
  );
};

/* ── 메인 컴포넌트 ── */
const HISTORY_LABELS = {
  MEMBER_ROLE_CHANGE: '역할 변경', MEMBER_SUSPEND: '정지', MEMBER_UNSUSPEND: '정지 해제',
  MEMBER_SUSPEND_EXPIRED: '자동 해제', MEMBER_WITHDRAW: '탈퇴 처리', MEMBER_RESTORE: '복구',
  MEMBER_STATUS_CHANGE: '상태 변경',
};
const AUDIT_LABELS = { LOGIN_FAILURE: '로그인 실패', LOGIN_SUCCESS: '로그인', ADMIN_API: '관리자 API', SERVICE: '서비스 동작' };
const fmt = (v) => (v ? v.slice(0, 16).replace('T', ' ') : '-');
const daysLeft = (iso) => Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));

const MemberDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const { user } = useAuth();

  const [member, setMember] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [tabPhotos, setTabPhotos] = useState([]);
  const [tabSeries, setTabSeries] = useState([]);
  const [tabPortfolios, setTabPortfolios] = useState([]);
  const [tabInquiries, setTabInquiries] = useState([]);
  const [tabComments, setTabComments] = useState([]);
  const [tabSecurity, setTabSecurity] = useState([]);
  const [history, setHistory] = useState([]);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [showSuspend, setShowSuspend] = useState(false);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const [hasPendingVerification, setHasPendingVerification] = useState(false);
  const [slidePortfolio, setSlidePortfolio] = useState(null);
  const [noteInput, setNoteInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const tabBarRef = useRef(null);

  const fetchMember = useCallback(() => {
    getApi(`/admin/members/${id}`).then(setMember).catch(() => {
      toast.error('회원 정보를 불러올 수 없습니다.');
      navigate('/members');
    });
  }, [id, navigate]);

  useEffect(() => { fetchMember(); }, [fetchMember]);

  const loadManage = useCallback(() => {
    getApi(`/admin/members/${id}/history`).then(setHistory).catch(() => {});
    getApi(`/admin/members/${id}/notes`).then(setNotes).catch(() => {});
  }, [id]);

  const afterAction = (msg) => {
    toast.success(msg);
    fetchMember();
    if (activeTab === 'manage') loadManage();
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setSavingNote(true);
    try {
      await postApi(`/admin/members/${id}/notes`, { content: newNote });
      setNewNote('');
      loadManage();
    } catch (e) {
      toast.error(e.message || '메모 저장에 실패했습니다.');
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteNote = async (note) => {
    const ok = await confirm({ title: '메모 삭제', description: '이 내부 메모를 삭제합니다.', variant: 'danger' });
    if (!ok) return;
    try {
      await deleteApi(`/admin/members/${id}/notes/${note.id}`);
      loadManage();
    } catch (e) {
      toast.error(e.message || '삭제에 실패했습니다.');
    }
  };

  const handleWithdraw = async () => {
    const ok = await confirm({
      title: '탈퇴 처리',
      description: `"${member.name}" 회원을 탈퇴 처리합니다. 데이터는 보존되며 언제든 복구할 수 있습니다.`,
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await patchApi(`/admin/members/${id}/status`, { status: 'DELETED' });
      afterAction('탈퇴 처리되었습니다.');
    } catch (e) { toast.error(e.message || '처리에 실패했습니다.'); }
  };

  const handleRestore = async () => {
    const ok = await confirm({ title: '회원 복구', description: `"${member.name}" 회원을 활성 상태로 복구합니다.`, variant: 'warning' });
    if (!ok) return;
    try {
      await patchApi(`/admin/members/${id}/status`, { status: 'ACTIVE' });
      afterAction('복구되었습니다.');
    } catch (e) { toast.error(e.message || '처리에 실패했습니다.'); }
  };

  const handlePurge = async () => {
    const ok = await confirm({
      title: '영구 삭제',
      description: `"${member.name}" 회원과 사진·시리즈·포트폴리오·예약·문의·댓글·프로필 콘텐츠를 영구 삭제합니다. 되돌릴 수 없습니다.`,
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteApi(`/admin/members/${id}`);
      toast.success('영구 삭제되었습니다.');
      navigate('/members');
    } catch (e) { toast.error(e.message || '삭제에 실패했습니다.'); }
  };

  useEffect(() => {
    if (!member) return;
    if (activeTab === 'photos') {
      getApi(`/admin/photos?memberId=${id}&size=6`).then(r => setTabPhotos(r.content || [])).catch(() => {});
    } else if (activeTab === 'series') {
      getApi(`/admin/series?memberId=${id}&size=6`).then(r => setTabSeries(r.content || [])).catch(() => {});
    } else if (activeTab === 'portfolios') {
      getApi(`/admin/portfolios?memberId=${id}&size=6`).then(r => setTabPortfolios(r.content || [])).catch(() => {});
    } else if (activeTab === 'inquiries') {
      getApi(`/admin/inquiries?senderId=${id}&size=10`).then(r => setTabInquiries(r.content || [])).catch(() => {});
    } else if (activeTab === 'comments') {
      getApi(`/admin/comments?memberId=${id}&size=20`).then(r => setTabComments(r.content || [])).catch(() => {});
    } else if (activeTab === 'security') {
      getApi(`/admin/security-audit?memberId=${id}&days=30&size=30`).then(r => setTabSecurity(r.content || [])).catch(() => {});
    } else if (activeTab === 'manage') {
      loadManage();
    }
  }, [activeTab, member, id, loadManage]);

  useEffect(() => {
    if (!member || member.isVerified) return;
    getApi(`/admin/verifications?memberId=${id}&status=PENDING&size=1`)
      .then(r => setHasPendingVerification((r.content || []).length > 0))
      .catch(() => {});
  }, [member, id]);

  const refreshPortfolios = useCallback(() => {
    getApi(`/admin/portfolios?memberId=${id}&size=6`).then(r => setTabPortfolios(r.content || [])).catch(() => {});
  }, [id]);

  const openPortfolioSlide = (p) => {
    setSlidePortfolio(p);
    setNoteInput(p.adminNote || '');
  };

  const handlePortfolioApprove = async () => {
    if (!slidePortfolio) return;
    setActionLoading(true);
    try {
      await patchApi(`/admin/portfolios/${slidePortfolio.id}/approve`, { adminNote: noteInput });
      toast.success('포트폴리오가 승인되었습니다.');
      setSlidePortfolio(null);
      refreshPortfolios();
      fetchMember();
    } catch { toast.error('처리에 실패했습니다.'); }
    finally { setActionLoading(false); }
  };

  const handlePortfolioReject = async () => {
    if (!slidePortfolio) return;
    if (!noteInput.trim()) { toast.error('반려 사유를 입력해 주세요.'); return; }
    setActionLoading(true);
    try {
      await patchApi(`/admin/portfolios/${slidePortfolio.id}/reject`, { adminNote: noteInput });
      toast.success('포트폴리오가 반려되었습니다.');
      setSlidePortfolio(null);
      refreshPortfolios();
      fetchMember();
    } catch { toast.error('처리에 실패했습니다.'); }
    finally { setActionLoading(false); }
  };

  const handleRoleChange = async (newAuthority) => {
    const ok = await confirm({
      title: '역할 변경',
      description: `"${member.name}"의 역할을 ${AUTHORITY_LABELS[newAuthority]}(${newAuthority})로 변경하시겠습니까?`,
      variant: 'warning',
    });
    if (!ok) return;
    try {
      await patchApi(`/admin/members/${id}/role`, { authority: newAuthority });
      afterAction('역할이 변경되었습니다.');
    } catch (e) { toast.error(e.message || '역할 변경에 실패했습니다.'); }
  };

  useEffect(() => {
    const place = () => {
      const el = tabBarRef.current?.querySelector('.mdp-tab.active');
      if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [activeTab, member]);

  const handleActivate = async () => {
    const ok = await confirm({ title: '정지 해제', description: `"${member.name}" 회원의 정지를 해제하시겠습니까?`, variant: 'warning' });
    if (!ok) return;
    try {
      await patchApi(`/admin/members/${id}/status`, { status: 'ACTIVE' });
      afterAction('정지가 해제되었습니다.');
    } catch (e) { toast.error(e.message || '처리에 실패했습니다.'); }
  };

  const handleSuspendConfirm = async (reason, suspendDays) => {
    setShowSuspend(false);
    try {
      await patchApi(`/admin/members/${id}/status`, { status: 'SUSPENDED', reason, suspendDays: suspendDays || null });
      afterAction('정지 처리되었습니다.');
    } catch (e) { toast.error(e.message || '처리에 실패했습니다.'); }
  };

  if (!member) {
    return (
      <div className="mdp-loading">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 20, width: `${[60, 40, 80][i]}%`, borderRadius: 6, marginBottom: 12 }} />
        ))}
      </div>
    );
  }

  const statusInfo = STATUS_MAP[member.status] || STATUS_MAP.INACTIVE;
  const isSelf = user?.memberId === member.id || user?.email === member.email;
  const isWm = user?.authority === 'WM';
  const canRestrict = !isSelf && (!(member.authority === 'WM' || member.authority === 'SA') || isWm);
  const color = avatarColor(member.name);

  return (
    <div className="member-detail-page">

      {/* 뒤로가기 */}
      <button className="mdp-back-btn" onClick={() => navigate('/members')}>
        <ArrowLeft size={15} />
        회원 목록
      </button>

      {/* ── 프로필 히어로 ── */}
      <div className="mdp-hero">
        <div className="mdp-avatar-wrap">
          <div className="mdp-avatar" style={{ background: color }}>
            {member.name?.charAt(0).toUpperCase()}
          </div>
          <div className={`mdp-status-ring ${statusInfo.cls}`} />
        </div>

        <div className="mdp-hero-info">
          <div className="mdp-name-row">
            <h1 className="mdp-name">{member.name}</h1>
            {member.isVerified && (
              <span className="mdp-verified-badge">
                <ShieldCheck size={13} />
                인증 작가
              </span>
            )}
            <span className={`mdp-status-chip ${statusInfo.cls}`}>{statusInfo.label}</span>
          </div>

          <div className="mdp-meta-row">
            <span className="mdp-meta-item"><Mail size={13} />{member.email}</span>
            {member.profileName && <span className="mdp-meta-item">@{member.profileName}</span>}
            {member.tel && <span className="mdp-meta-item"><Phone size={13} />{member.tel}</span>}
            <span className="mdp-meta-item"><Calendar size={13} />{member.createdAt?.slice(0, 10)} 가입</span>
          </div>

          {member.status === 'SUSPENDED' && member.suspendReason && (
            <div className="mdp-suspend-banner">
              <span className="mdp-suspend-label">정지 사유</span>
              <span className="mdp-suspend-text">{member.suspendReason}</span>
              {member.suspendUntil
                ? <span className="mdp-suspend-until">~ {member.suspendUntil.slice(0, 10)} · {daysLeft(member.suspendUntil)}일 후 자동 해제</span>
                : <span className="mdp-suspend-until">영구</span>}
            </div>
          )}
        </div>

        <div className="mdp-hero-actions">
          {isSelf ? <span className="mdp-self-note">본인 계정은 여기서 조치할 수 없습니다</span>
            : member.status === 'DELETED' ? (
              <>
                <button className="btn btn-outline btn-md" onClick={handleRestore}>복구</button>
                {isWm && <button className="btn btn-danger-outline btn-md" onClick={handlePurge}>영구 삭제</button>}
              </>
            ) : (
              <>
                {member.status === 'SUSPENDED' && <button className="btn btn-warning btn-md" onClick={handleActivate}>정지 해제</button>}
                {member.status === 'ACTIVE' && canRestrict && <button className="btn btn-outline btn-md" onClick={() => setShowSuspend(true)}>정지</button>}
                {canRestrict && <button className="btn btn-danger-outline btn-md" onClick={handleWithdraw}>탈퇴 처리</button>}
              </>
            )}
          <Link to={`/profile-content?memberId=${id}`} className="mdp-side-link"><IdCard size={13} /> 프로필 콘텐츠</Link>
        </div>
      </div>

      {/* ── KPI ── */}
      <div className="mdp-kpi-grid">
        <KpiCard icon={Camera}        label="사진"       value={member.photoCount}     color="#EC572D" delay={0} />
        <KpiCard icon={BookOpen}      label="시리즈"     value={member.seriesCount}    color="#2F7A8C" delay={60} />
        <KpiCard icon={MessageSquare} label="문의"       value={member.inquiryCount}   color="#6A5B8C" delay={120} />
        <KpiCard icon={FolderOpen}    label="포트폴리오" value={member.portfolioCount} color="#3F8A57" delay={180} />
      </div>

      {/* ── 탭 ── */}
      <div className="mdp-tabs" ref={tabBarRef}>
        {TABS.map(t => (
          <button
            key={t.key}
            className={`mdp-tab${activeTab === t.key ? ' active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >{t.label}</button>
        ))}
        <div className="mdp-tab-indicator" style={{ left: indicator.left, width: indicator.width }} />
      </div>

      {/* ── 탭 콘텐츠 ── */}
      <div className="mdp-tab-content">

        {activeTab === 'summary' && (
          <div className="mdp-summary-grid">
            <div className="mdp-info-card">
              <div className="mdp-card-title">기본 정보</div>
              <div className="mdp-info-list">
                <div className="mdp-info-row"><span>가입일</span><span>{member.createdAt?.slice(0, 10)}</span></div>
                <div className="mdp-info-row">
                  <span>권한</span>
                  <select
                    className="role-select badge badge-purple"
                    value={member.authority}
                    onChange={e => handleRoleChange(e.target.value)}
                  >
                    {Object.entries(AUTHORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="mdp-info-row">
                  <span>작가 인증</span>
                  {member.isVerified ? (
                    <span className="mdp-verified-text">
                      인증됨 ({member.verifiedAt?.slice(0, 10)}) ·{' '}
                      <button className="mdp-inline-link" onClick={() => navigate(`/verifications?memberId=${id}`)}>인증 내역 보기 ↗</button>
                    </span>
                  ) : hasPendingVerification ? (
                    <span className="mdp-unverified-text">
                      미인증 ·{' '}
                      <button className="mdp-inline-link" onClick={() => navigate(`/verifications?memberId=${id}`)}>심사 대기 중 — 인증 관리에서 보기 ↗</button>
                    </span>
                  ) : (
                    <span className="mdp-unverified-text">미인증</span>
                  )}
                </div>
              </div>
            </div>

            {member.status === 'SUSPENDED' && (
              <div className="mdp-info-card mdp-info-card--danger">
                <div className="mdp-card-title">정지 정보</div>
                <div className="mdp-info-list">
                  <div className="mdp-info-row"><span>정지일</span><span>{member.suspendedAt?.slice(0, 10) || '—'}</span></div>
                  <div className="mdp-info-row"><span>해제일</span><span>{member.suspendUntil ? member.suspendUntil.slice(0, 10) : '영구'}</span></div>
                  <div className="mdp-info-row"><span>사유</span><span>{member.suspendReason || '—'}</span></div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'photos' && (
          <div className="mdp-photos-grid">
            {tabPhotos.length === 0
              ? <div className="mdp-empty"><Camera size={32} /><span>등록된 사진이 없습니다.</span></div>
              : tabPhotos.map(p => <PhotoThumb key={p.id} photo={p} />)
            }
          </div>
        )}

        {activeTab === 'series' && (
          <div className="mdp-list-stack">
            {tabSeries.length === 0
              ? <div className="mdp-empty"><BookOpen size={32} /><span>등록된 시리즈가 없습니다.</span></div>
              : tabSeries.map(s => (
                <div key={s.id} className="mdp-list-item">
                  <BookOpen size={16} className="mdp-list-icon" />
                  <span className="mdp-list-title">{s.title}</span>
                  <span className="mdp-list-meta">{s.photoCount ?? 0}장</span>
                </div>
              ))
            }
          </div>
        )}

        {activeTab === 'portfolios' && (
          <div className="mdp-photos-grid">
            {tabPortfolios.length === 0
              ? <div className="mdp-empty"><FolderOpen size={32} /><span>등록된 포트폴리오가 없습니다.</span></div>
              : tabPortfolios.map(p => (
                <PortfolioThumb key={p.id} portfolio={p} onClick={() => openPortfolioSlide(p)} />
              ))
            }
          </div>
        )}

        {activeTab === 'inquiries' && (
          <div className="mdp-list-stack">
            {tabInquiries.length === 0
              ? <div className="mdp-empty"><MessageSquare size={32} /><span>문의 내역이 없습니다.</span></div>
              : tabInquiries.map(i => (
                <div key={i.id} className="mdp-list-item">
                  <MessageSquare size={16} className="mdp-list-icon" />
                  <span className="mdp-list-title">{i.shootType || '기타'}</span>
                  <span className="mdp-list-meta">{i.createdAt?.slice(0, 10)}</span>
                </div>
              ))
            }
          </div>
        )}
        {activeTab === 'comments' && (
          <div className="mdp-list-stack">
            {tabComments.length === 0
              ? <div className="mdp-empty"><MessageSquare size={32} /><span>작성한 댓글이 없습니다.</span></div>
              : tabComments.map(c => (
                <div key={c.id} className="mdp-list-item">
                  <MessageSquare size={16} className="mdp-list-icon" />
                  <span className="mdp-list-title mdp-comment-text">{c.parentId ? '↳ ' : ''}{c.content}</span>
                  <span className="mdp-list-meta">{c.photoTitle || `사진 #${c.photoId}`} · {fmt(c.createdAt)}</span>
                </div>
              ))}
            {tabComments.length > 0 && <Link to="/comments" className="mdp-side-link mdp-more-link">댓글 관리에서 보기 →</Link>}
          </div>
        )}

        {activeTab === 'security' && (
          <div className="mdp-list-stack">
            {tabSecurity.length === 0
              ? <div className="mdp-empty"><ShieldAlert size={32} /><span>최근 30일 보안 기록이 없습니다.</span></div>
              : tabSecurity.map(l => (
                <div key={l.id} className="mdp-list-item">
                  <span className={`badge ${l.success ? 'badge-green' : 'badge-red'}`}>{AUDIT_LABELS[l.actionType] || l.actionType}</span>
                  <span className="mdp-list-title">{l.actionDetail || '-'}{l.errorMessage && <span className="mdp-audit-error"> · {l.errorMessage}</span>}</span>
                  <span className="mdp-list-meta">{l.ipAddress || '-'} · {fmt(l.createdAt)}</span>
                </div>
              ))}
          </div>
        )}

        {activeTab === 'manage' && (
          <div className="mdp-manage">
            <section className="mdp-card">
              <div className="mdp-card-title"><StickyNote size={14} /> 내부 메모 <span className="mdp-card-hint">회원에게 보이지 않습니다</span></div>
              <div className="mdp-note-form">
                <textarea
                  className="modal-textarea"
                  rows={3}
                  maxLength={2000}
                  placeholder="상담 내용, 조치 근거, 다음 담당자에게 남길 말"
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                />
                <button type="button" className="btn btn-primary btn-sm" onClick={handleAddNote} disabled={savingNote || !newNote.trim()}>
                  {savingNote ? '저장 중...' : '메모 남기기'}
                </button>
              </div>
              {notes.length === 0 ? <div className="mdp-note-empty">아직 메모가 없습니다.</div> : (
                <ul className="mdp-notes">
                  {notes.map(n => (
                    <li key={n.id} className="mdp-note">
                      <div className="mdp-note-head">
                        <strong>{n.adminName || '관리자'}</strong>
                        <span>{fmt(n.createdAt)}</span>
                        {(n.adminId === user?.memberId || isWm) && (
                          <button type="button" className="mdp-note-del" aria-label="메모 삭제" onClick={() => handleDeleteNote(n)}><Trash2 size={13} /></button>
                        )}
                      </div>
                      <p>{n.content}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="mdp-card">
              <div className="mdp-card-title"><History size={14} /> 조치 이력</div>
              {history.length === 0 ? <div className="mdp-note-empty">기록된 조치가 없습니다.</div> : (
                <ol className="mdp-timeline">
                  {history.map(h => (
                    <li key={h.id}>
                      <span className={`mdp-tl-dot mdp-tl-${h.action}`} />
                      <div className="mdp-tl-body">
                        <div className="mdp-tl-head"><strong>{HISTORY_LABELS[h.action] || h.action}</strong><span>{h.adminName || '-'} · {fmt(h.createdAt)}</span></div>
                        <div className="mdp-tl-detail">{h.details}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        )}
      </div>

      {showSuspend && (
        <SuspendModal member={member} onClose={() => setShowSuspend(false)} onConfirm={handleSuspendConfirm} />
      )}

      <SlideOver
        open={!!slidePortfolio}
        onClose={() => setSlidePortfolio(null)}
        title="포트폴리오 상세 / 심사"
        width={520}
        footer={
          slidePortfolio && (
            <>
              <button className="btn btn-ghost btn-md" onClick={() => setSlidePortfolio(null)}>닫기</button>
              {slidePortfolio.status === 'PENDING' && (
                <>
                  <button className="btn btn-danger-full btn-md" onClick={handlePortfolioReject} disabled={actionLoading}>반려</button>
                  <button className="btn btn-success btn-md" onClick={handlePortfolioApprove} disabled={actionLoading}>승인</button>
                </>
              )}
            </>
          )
        }
      >
        {slidePortfolio && (
          <>
            <div className="so-field">
              <span className="so-label">제목</span>
              <span className="so-value">{slidePortfolio.title}</span>
            </div>
            <div className="so-field">
              <span className="so-label">상태</span>
              <span className="so-value">
                <span className={`badge ${PF_STATUS_BADGE[slidePortfolio.status] || ''}`}>{PF_STATUS_LABELS[slidePortfolio.status]}</span>
              </span>
            </div>
            <div className="so-field">
              <span className="so-label">구성</span>
              <span className="so-value">사진 {slidePortfolio.photoCount}장 · 시리즈 {slidePortfolio.seriesCount}개</span>
            </div>
            <div className="so-field">
              <span className="so-label">통계</span>
              <span className="so-value">❤️ {slidePortfolio.likesCount} · 👁 {slidePortfolio.viewCount}</span>
            </div>
            <div className="so-field">
              <span className="so-label">등록일</span>
              <span className="so-value">{slidePortfolio.createdAt?.slice(0, 10)}</span>
            </div>
            <hr className="so-divider" />
            <div className="so-field">
              <span className="so-label">관리자 메모 {slidePortfolio.status === 'PENDING' && <span style={{ color: 'var(--color-danger)', fontWeight: 400 }}>(반려 시 필수)</span>}</span>
              <textarea
                className="so-textarea"
                rows={3}
                value={noteInput}
                onChange={e => setNoteInput(e.target.value)}
                placeholder="관리자 메모 또는 반려 사유를 입력하세요."
              />
            </div>
          </>
        )}
      </SlideOver>
    </div>
  );
};

export default MemberDetailPage;

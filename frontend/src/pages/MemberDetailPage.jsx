import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, ShieldCheck, Camera, BookOpen,
  MessageSquare, FolderOpen, Calendar, Phone, Mail,
} from 'lucide-react';
import { getApi, patchApi } from '../utils/api';
import { useConfirm } from '../context/ConfirmContext';
import './MemberDetailPage.css';

const TABS = [
  { key: 'summary', label: '활동 요약' },
  { key: 'photos',  label: '사진' },
  { key: 'series',  label: '시리즈' },
  { key: 'inquiries', label: '문의' },
];

const STATUS_MAP = {
  ACTIVE:    { label: '활성',   cls: 'sc-active' },
  INACTIVE:  { label: '비활성', cls: 'sc-inactive' },
  SUSPENDED: { label: '정지',   cls: 'sc-suspended' },
  DELETED:   { label: '삭제됨', cls: 'sc-deleted' },
};

const AVATAR_COLORS = ['#E60023','#2563eb','#7c3aed','#059669','#d97706','#0891b2','#be185d'];
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

/* ── 메인 컴포넌트 ── */
const MemberDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { confirm } = useConfirm();

  const [member, setMember] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [tabPhotos, setTabPhotos] = useState([]);
  const [tabSeries, setTabSeries] = useState([]);
  const [tabInquiries, setTabInquiries] = useState([]);
  const [showSuspend, setShowSuspend] = useState(false);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const tabBarRef = useRef(null);

  const fetchMember = useCallback(() => {
    getApi(`/admin/members/${id}`).then(setMember).catch(() => {
      toast.error('회원 정보를 불러올 수 없습니다.');
      navigate('/members');
    });
  }, [id, navigate]);

  useEffect(() => { fetchMember(); }, [fetchMember]);

  useEffect(() => {
    if (!member) return;
    if (activeTab === 'photos') {
      getApi(`/admin/photos?memberId=${id}&size=6`).then(r => setTabPhotos(r.content || [])).catch(() => {});
    } else if (activeTab === 'series') {
      getApi(`/admin/series?memberId=${id}&size=6`).then(r => setTabSeries(r.content || [])).catch(() => {});
    } else if (activeTab === 'inquiries') {
      getApi(`/admin/inquiries?senderId=${id}&size=10`).then(r => setTabInquiries(r.content || [])).catch(() => {});
    }
  }, [activeTab, member, id]);

  useEffect(() => {
    if (!tabBarRef.current) return;
    const el = tabBarRef.current.querySelector('.mdp-tab.active');
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [activeTab, member]);

  const handleActivate = async () => {
    const ok = await confirm({ title: '정지 해제', description: `"${member.name}" 회원의 정지를 해제하시겠습니까?`, variant: 'warning' });
    if (!ok) return;
    try {
      await patchApi(`/admin/members/${id}/status`, { status: 'ACTIVE' });
      toast.success('정지가 해제되었습니다.');
      fetchMember();
    } catch { toast.error('처리에 실패했습니다.'); }
  };

  const handleSuspendConfirm = async (reason, suspendDays) => {
    setShowSuspend(false);
    try {
      await patchApi(`/admin/members/${id}/status`, { status: 'SUSPENDED', reason, suspendDays: suspendDays || null });
      toast.success('정지 처리되었습니다.');
      fetchMember();
    } catch { toast.error('처리에 실패했습니다.'); }
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
                ? <span className="mdp-suspend-until">~ {member.suspendUntil.slice(0, 10)}</span>
                : <span className="mdp-suspend-until">영구</span>}
            </div>
          )}
        </div>

        <div className="mdp-hero-actions">
          {member.status === 'SUSPENDED'
            ? <button className="btn btn-warning btn-md" onClick={handleActivate}>정지 해제</button>
            : member.status === 'ACTIVE'
              ? <button className="btn btn-outline btn-md" onClick={() => setShowSuspend(true)}>정지</button>
              : null}
        </div>
      </div>

      {/* ── KPI ── */}
      <div className="mdp-kpi-grid">
        <KpiCard icon={Camera}       label="사진"       value={member.photoCount}     color="#E60023" delay={0} />
        <KpiCard icon={BookOpen}     label="시리즈"     value={member.seriesCount}    color="#2563eb" delay={60} />
        <KpiCard icon={MessageSquare} label="문의"      value={member.inquiryCount}   color="#7c3aed" delay={120} />
        <KpiCard icon={FolderOpen}   label="포트폴리오" value={member.portfolioCount} color="#059669" delay={180} />
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
                <div className="mdp-info-row"><span>권한</span><span>{member.authority}</span></div>
                <div className="mdp-info-row">
                  <span>작가 인증</span>
                  <span className={member.isVerified ? 'mdp-verified-text' : 'mdp-unverified-text'}>
                    {member.isVerified ? `인증됨 (${member.verifiedAt?.slice(0, 10)})` : '미인증'}
                  </span>
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
      </div>

      {showSuspend && (
        <SuspendModal member={member} onClose={() => setShowSuspend(false)} onConfirm={handleSuspendConfirm} />
      )}
    </div>
  );
};

export default MemberDetailPage;

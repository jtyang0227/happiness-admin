import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, ShieldCheck, Camera, BookOpen, MessageSquare, FolderOpen } from 'lucide-react';
import { getApi, patchApi } from '../utils/api';
import { useConfirm } from '../context/ConfirmContext';
import './MemberDetailPage.css';

const TABS = [
  { key: 'summary', label: '활동 요약' },
  { key: 'photos', label: '사진' },
  { key: 'series', label: '시리즈' },
  { key: 'inquiries', label: '문의' },
];

const STATUS_LABELS = { ACTIVE: '활성', INACTIVE: '비활성', SUSPENDED: '정지', DELETED: '삭제됨' };
const STATUS_COLORS = { ACTIVE: 'status-chip--active', INACTIVE: 'status-chip--inactive', SUSPENDED: 'status-chip--suspended', DELETED: 'status-chip--deleted' };

const SuspendModal = ({ member, onClose, onConfirm }) => {
  const [reason, setReason] = useState(member.suspendReason || '');
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
              <button key={v} className={`period-chip${days === v ? ' selected' : ''}`} onClick={() => setDays(v)}>{l}</button>
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

const KpiCard = ({ icon: Icon, label, value, color }) => (
  <div className="kpi-card">
    <div className="kpi-icon" style={{ background: color + '18', color }}>
      <Icon size={20} />
    </div>
    <div className="kpi-body">
      <div className="kpi-value">{value?.toLocaleString() ?? 0}</div>
      <div className="kpi-label">{label}</div>
    </div>
  </div>
);

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
  const tabBarRef = useRef(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

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
    const el = tabBarRef.current.querySelector('.member-tab.active');
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [activeTab, member]);

  const handleActivate = async () => {
    const ok = await confirm({ title: '정지 해제', description: `"${member.name}" 회원의 정지를 해제하시겠습니까?`, variant: 'warning' });
    if (!ok) return;
    try {
      await patchApi(`/admin/members/${id}/status`, { status: 'ACTIVE' });
      toast.success('정지가 해제되었습니다.');
      fetchMember();
    } catch {
      toast.error('처리에 실패했습니다.');
    }
  };

  const handleSuspendConfirm = async (reason, suspendDays) => {
    setShowSuspend(false);
    try {
      await patchApi(`/admin/members/${id}/status`, { status: 'SUSPENDED', reason, suspendDays: suspendDays || null });
      toast.success('정지 처리되었습니다.');
      fetchMember();
    } catch {
      toast.error('처리에 실패했습니다.');
    }
  };

  if (!member) {
    return (
      <div className="detail-loading">
        <div className="skeleton" style={{ width: 200, height: 20 }} />
      </div>
    );
  }

  return (
    <div className="member-detail">
      <button className="back-btn" onClick={() => navigate('/members')}>
        <ArrowLeft size={16} />
        <span>회원 목록</span>
      </button>

      {/* 프로필 카드 */}
      <div className="profile-card">
        <div className="profile-avatar">
          {member.name?.slice(0, 2).toUpperCase()}
        </div>
        <div className="profile-info">
          <div className="profile-name-row">
            <span className="profile-name">{member.name}</span>
            {member.isVerified && (
              <span className="verified-badge">
                <ShieldCheck size={14} />
                인증 작가
              </span>
            )}
            <span className={`status-chip ${STATUS_COLORS[member.status]}`}>
              {STATUS_LABELS[member.status]}
            </span>
          </div>
          <div className="profile-meta">
            <span>{member.email}</span>
            {member.profileName && <span>@{member.profileName}</span>}
            {member.tel && <span>{member.tel}</span>}
          </div>
          {member.status === 'SUSPENDED' && member.suspendReason && (
            <div className="suspend-info">
              <span className="suspend-label">정지 사유:</span>
              <span className="suspend-reason">{member.suspendReason}</span>
              {member.suspendUntil && (
                <span className="suspend-until">~ {member.suspendUntil?.slice(0, 10)}</span>
              )}
            </div>
          )}
        </div>
        <div className="profile-actions">
          {member.status === 'SUSPENDED' ? (
            <button className="btn btn-warning btn-md" onClick={handleActivate}>정지 해제</button>
          ) : member.status === 'ACTIVE' ? (
            <button className="btn btn-outline btn-md" onClick={() => setShowSuspend(true)}>정지</button>
          ) : null}
        </div>
      </div>

      {/* KPI 카드 */}
      <div className="member-kpi-grid">
        <KpiCard icon={Camera} label="사진" value={member.photoCount} color="#E60023" />
        <KpiCard icon={BookOpen} label="시리즈" value={member.seriesCount} color="#2563eb" />
        <KpiCard icon={MessageSquare} label="문의" value={member.inquiryCount} color="#7c3aed" />
        <KpiCard icon={FolderOpen} label="포트폴리오" value={member.portfolioCount} color="#059669" />
      </div>

      {/* 탭 */}
      <div className="member-tabs" ref={tabBarRef}>
        {TABS.map(t => (
          <button
            key={t.key}
            className={`member-tab${activeTab === t.key ? ' active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >{t.label}</button>
        ))}
        <div className="member-tab-indicator" style={{ left: indicator.left, width: indicator.width }} />
      </div>

      {/* 탭 콘텐츠 */}
      <div className="tab-content">
        {activeTab === 'summary' && (
          <div className="summary-grid">
            <div className="summary-section">
              <div className="summary-section-title">기본 정보</div>
              <div className="info-table">
                <div className="info-row"><span>가입일</span><span>{member.createdAt?.slice(0, 10)}</span></div>
                <div className="info-row"><span>권한</span><span>{member.authority}</span></div>
                <div className="info-row"><span>이메일 인증</span><span>{member.isVerified ? `인증됨 (${member.verifiedAt?.slice(0, 10)})` : '미인증'}</span></div>
              </div>
            </div>
            {member.status === 'SUSPENDED' && (
              <div className="summary-section">
                <div className="summary-section-title">정지 정보</div>
                <div className="info-table">
                  <div className="info-row"><span>정지일</span><span>{member.suspendedAt?.slice(0, 10) || '-'}</span></div>
                  <div className="info-row"><span>해제일</span><span>{member.suspendUntil ? member.suspendUntil.slice(0, 10) : '영구'}</span></div>
                  <div className="info-row"><span>사유</span><span>{member.suspendReason || '-'}</span></div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'photos' && (
          <div className="photos-grid">
            {tabPhotos.length === 0 ? (
              <div className="empty-state">등록된 사진이 없습니다.</div>
            ) : tabPhotos.map(p => (
              <div key={p.id} className="photo-thumb">
                <div className="photo-thumb-img" style={{ background: '#f1f5f9' }}>
                  <Camera size={24} color="#94a3b8" />
                </div>
                <div className="photo-thumb-title">{p.title || '제목 없음'}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'series' && (
          <div className="series-list">
            {tabSeries.length === 0 ? (
              <div className="empty-state">등록된 시리즈가 없습니다.</div>
            ) : tabSeries.map(s => (
              <div key={s.id} className="series-item">
                <BookOpen size={16} color="#2563eb" />
                <span>{s.title}</span>
                <span className="series-count">{s.photoCount}장</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'inquiries' && (
          <div className="inquiries-list">
            {tabInquiries.length === 0 ? (
              <div className="empty-state">문의 내역이 없습니다.</div>
            ) : tabInquiries.map(i => (
              <div key={i.id} className="inquiry-item">
                <div className="inquiry-type">{i.shootType || '-'}</div>
                <div className="inquiry-date">{i.createdAt?.slice(0, 10)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showSuspend && (
        <SuspendModal
          member={member}
          onClose={() => setShowSuspend(false)}
          onConfirm={handleSuspendConfirm}
        />
      )}
    </div>
  );
};

export default MemberDetailPage;

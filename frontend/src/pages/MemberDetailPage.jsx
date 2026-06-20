import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getApi, patchApi, deleteApi } from '../utils/api';
import { useConfirm } from '../context/ConfirmContext';
import ImgWithFallback from '../components/common/ImgWithFallback';
import './MemberDetailPage.css';

const STATUS_LABELS = { ACTIVE: '활성', SUSPENDED: '정지', INACTIVE: '비활성', DELETED: '삭제됨' };
const STATUS_CLASSES = { ACTIVE: 'badge-green', SUSPENDED: 'badge-red', INACTIVE: 'badge-yellow', DELETED: 'badge-red' };
const AUTH_LABELS = { WM: '웹관리자', SA: '운영자', US: '일반' };
const AUTH_CLASSES = { WM: 'badge-purple', SA: 'badge-blue', US: 'badge-green' };

const TABS = [
  { key: 'photos', label: '사진' },
  { key: 'received', label: '받은 문의' },
  { key: 'sent', label: '보낸 문의' },
  { key: 'series', label: '시리즈' },
];

const MemberDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { confirm } = useConfirm();

  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('photos');
  const [tabData, setTabData] = useState({});
  const [tabLoading, setTabLoading] = useState(false);
  const [suspendModal, setSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspending, setSuspending] = useState(false);

  const loadMember = useCallback(async () => {
    try {
      const data = await getApi(`/admin/members/${id}`);
      setMember(data);
    } catch {
      toast.error('회원 정보를 불러오지 못했습니다.');
      navigate('/members');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { loadMember(); }, [loadMember]);

  const loadTab = useCallback(async (tab) => {
    setTabLoading(true);
    try {
      let data;
      if (tab === 'photos') data = await getApi(`/admin/photos?memberId=${id}&size=12&page=0`);
      else if (tab === 'received') data = await getApi(`/admin/inquiries?receiverId=${id}&size=10&page=0`);
      else if (tab === 'sent') data = await getApi(`/admin/inquiries?senderId=${id}&size=10&page=0`);
      else if (tab === 'series') data = await getApi(`/admin/series?memberId=${id}&size=10&page=0`);
      setTabData(prev => ({ ...prev, [tab]: data }));
    } catch {
      setTabData(prev => ({ ...prev, [tab]: { content: [], totalElements: 0 } }));
    } finally {
      setTabLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!tabData[activeTab]) loadTab(activeTab);
  }, [activeTab, tabData, loadTab]);

  const handleRoleChange = async (newAuthority) => {
    const LABELS = { WM: '웹관리자', SA: '운영자', US: '일반 회원' };
    const ok = await confirm({
      title: '역할 변경',
      description: `역할을 ${LABELS[newAuthority]}(${newAuthority})로 변경하시겠습니까?`,
      variant: 'warning',
    });
    if (!ok) { loadMember(); return; }
    try {
      await patchApi(`/admin/members/${id}/role`, { authority: newAuthority });
      toast.success('역할이 변경되었습니다.');
      loadMember();
    } catch {
      toast.error('역할 변경에 실패했습니다.');
      loadMember();
    }
  };

  const handleSuspendConfirm = async () => {
    if (!suspendReason.trim()) return;
    setSuspending(true);
    try {
      await patchApi(`/admin/members/${id}/status`, { status: 'SUSPENDED', reason: suspendReason });
      toast.success('회원이 정지되었습니다.');
      setSuspendModal(false);
      setSuspendReason('');
      loadMember();
    } catch {
      toast.error('정지 처리에 실패했습니다.');
    } finally {
      setSuspending(false);
    }
  };

  const handleActivate = async () => {
    const ok = await confirm({
      title: '정지 해제',
      description: `"${member.name}" 회원의 정지를 해제하시겠습니까?`,
      variant: 'warning',
    });
    if (!ok) return;
    try {
      await patchApi(`/admin/members/${id}/status`, { status: 'ACTIVE', reason: '' });
      toast.success('정지가 해제되었습니다.');
      loadMember();
    } catch {
      toast.error('상태 변경에 실패했습니다.');
    }
  };

  const handleDeletePhoto = async (photoId) => {
    const ok = await confirm({ title: '사진 삭제', description: '이 사진을 삭제합니다. 되돌릴 수 없습니다.', variant: 'danger' });
    if (!ok) return;
    try {
      await deleteApi(`/admin/photos/${photoId}`);
      toast.success('사진이 삭제되었습니다.');
      setTabData(prev => {
        const photos = prev.photos;
        if (!photos) return prev;
        return { ...prev, photos: { ...photos, content: photos.content.filter(p => p.id !== photoId) } };
      });
      loadMember();
    } catch {
      toast.error('삭제에 실패했습니다.');
    }
  };

  if (loading) return <div className="page-loading">로딩 중...</div>;
  if (!member) return null;

  const currentTabData = tabData[activeTab];

  return (
    <div className="member-detail-page">
      <div className="detail-breadcrumb">
        <Link to="/members" className="back-link">← 회원 목록</Link>
      </div>

      <div className="detail-header">
        <div>
          <h1 className="page-title">{member.name}</h1>
          {member.profileName && <span className="detail-handle">{member.profileName}</span>}
        </div>
        <div className="detail-header-actions">
          <span className={`badge ${STATUS_CLASSES[member.status] || 'badge-green'}`}>
            {STATUS_LABELS[member.status] || member.status}
          </span>
          {member.status === 'SUSPENDED'
            ? <button className="btn-warning-action" onClick={handleActivate}>정지 해제</button>
            : member.status === 'ACTIVE'
              ? <button className="btn-danger-action" onClick={() => { setSuspendModal(true); setSuspendReason(''); }}>정지하기</button>
              : null
          }
        </div>
      </div>

      <div className="detail-info-grid">
        <div className="detail-card">
          <h3 className="detail-card-title">기본 정보</h3>
          <div className="detail-info-rows">
            <div className="info-row">
              <span className="info-label">이메일</span>
              <span className="info-value">{member.email}</span>
            </div>
            <div className="info-row">
              <span className="info-label">역할</span>
              <span className="info-value info-value-row">
                <span className={`badge ${AUTH_CLASSES[member.authority] || 'badge-green'}`}>
                  {AUTH_LABELS[member.authority] || member.authority}
                </span>
                <select
                  className="role-select-sm"
                  value={member.authority}
                  onChange={e => handleRoleChange(e.target.value)}
                >
                  <option value="WM">웹관리자</option>
                  <option value="SA">운영자</option>
                  <option value="US">일반</option>
                </select>
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">가입 유형</span>
              <span className="info-value">{member.provider || 'local'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">가입일</span>
              <span className="info-value">{member.createdAt?.slice(0, 10)}</span>
            </div>
          </div>
        </div>

        <div className="detail-card">
          <h3 className="detail-card-title">활동 현황</h3>
          <div className="detail-stats-grid">
            <div className="detail-stat">
              <div className="detail-stat-value">{member.photoCount}</div>
              <div className="detail-stat-label">사진</div>
            </div>
            <div className="detail-stat">
              <div className="detail-stat-value">{member.seriesCount}</div>
              <div className="detail-stat-label">시리즈</div>
            </div>
            <div className="detail-stat">
              <div className="detail-stat-value">{member.inquiryCount}</div>
              <div className="detail-stat-label">문의</div>
            </div>
          </div>
        </div>
      </div>

      <div className="detail-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`detail-tab${activeTab === t.key ? ' active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="detail-tab-content">
        {tabLoading ? (
          <div className="loading-cell">로딩 중...</div>
        ) : activeTab === 'photos' ? (
          <div className="photos-grid">
            {!currentTabData || currentTabData.content?.length === 0
              ? <div className="empty-state">등록된 사진이 없습니다.</div>
              : currentTabData.content.map(p => (
                  <div key={p.id} className="photo-thumb-card">
                    <ImgWithFallback src={p.thumbnailUrl} alt={p.title} className="photo-thumb-img" />
                    <div className="photo-thumb-info">
                      <div className="photo-thumb-title">{p.title}</div>
                      <div className="photo-thumb-meta">❤️ {p.likesCount}</div>
                    </div>
                    <button className="photo-delete-btn" onClick={() => handleDeletePhoto(p.id)}>삭제</button>
                  </div>
                ))
            }
          </div>
        ) : activeTab === 'received' || activeTab === 'sent' ? (
          <div className="table-card">
            <table className="data-table">
              <thead>
                <tr>
                  {activeTab === 'received'
                    ? <><th>보낸 사람</th><th>이메일</th></>
                    : <><th>수신 작가</th><th>프로필</th></>
                  }
                  <th>촬영 종류</th><th>희망 날짜</th><th>상태</th><th>날짜</th>
                </tr>
              </thead>
              <tbody>
                {!currentTabData || currentTabData.content?.length === 0 ? (
                  <tr><td colSpan="6" className="loading-cell">문의 내역이 없습니다.</td></tr>
                ) : currentTabData.content.map(inq => (
                  <tr key={inq.id}>
                    {activeTab === 'received'
                      ? <><td>{inq.senderName}</td><td>{inq.senderEmail}</td></>
                      : <><td>{inq.receiverName || '-'}</td><td>{inq.receiverProfileName || '-'}</td></>
                    }
                    <td>{inq.shootType || '-'}</td>
                    <td>{inq.shootDate || '-'}</td>
                    <td>
                      <span className={`badge ${inq.isRead ? 'badge-green' : 'badge-yellow'}`}>
                        {inq.isRead ? '읽음' : '미읽음'}
                      </span>
                    </td>
                    <td>{inq.createdAt?.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'series' ? (
          <div className="table-card">
            <table className="data-table">
              <thead>
                <tr><th>제목</th><th>사진 수</th><th>생성일</th></tr>
              </thead>
              <tbody>
                {!currentTabData || currentTabData.content?.length === 0 ? (
                  <tr><td colSpan="3" className="loading-cell">등록된 시리즈가 없습니다.</td></tr>
                ) : currentTabData.content.map(s => (
                  <tr key={s.id}>
                    <td className="name-cell">{s.title}</td>
                    <td>{s.photoCount}장</td>
                    <td>{s.createdAt?.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      {suspendModal && (
        <div className="modal-overlay" onClick={() => !suspending && setSuspendModal(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-icon warning">⚠</div>
            <h3 className="modal-title">회원 정지</h3>
            <p className="modal-desc">{member.name}({member.email})을 정지합니다.</p>
            <label className="modal-label">정지 사유 (필수)</label>
            <textarea
              className="modal-textarea"
              value={suspendReason}
              onChange={e => setSuspendReason(e.target.value)}
              placeholder="정지 사유를 입력하세요"
              rows={3}
            />
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setSuspendModal(false)} disabled={suspending}>취소</button>
              <button className="btn-danger-modal" onClick={handleSuspendConfirm} disabled={!suspendReason.trim() || suspending}>
                {suspending ? '처리 중...' : '정지 처리'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberDetailPage;

import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getApi, postApi } from '../utils/api';
import Pagination from '../components/common/Pagination';
import './VerificationListPage.css';

const STATUS_LABELS = { PENDING: '신청 대기', APPROVED: '승인됨', REJECTED: '반려됨' };
const STATUS_CLASSES = { PENDING: 'badge-yellow', APPROVED: 'badge-green', REJECTED: 'badge-red' };

const VerificationListPage = () => {
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [counts, setCounts] = useState({});
  const [status, setStatus] = useState('PENDING');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, size: 20 });
    if (status) params.set('status', status);
    Promise.all([
      getApi(`/admin/verifications?${params}`),
      getApi('/admin/verifications/counts'),
    ]).then(([d, c]) => { setData(d); setCounts(c); })
      .finally(() => setLoading(false));
  }, [page, status]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApprove = async (id, name) => {
    setProcessing(true);
    try {
      await postApi(`/admin/verifications/${id}/approve`, {});
      toast.success(`${name} 작가 인증이 승인되었습니다.`);
      fetchData();
    } catch {
      toast.error('승인에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectReason.trim()) return;
    setProcessing(true);
    try {
      await postApi(`/admin/verifications/${rejectModal.id}/reject`, { reason: rejectReason });
      toast.success('반려 처리되었습니다.');
      setRejectModal(null);
      setRejectReason('');
      fetchData();
    } catch {
      toast.error('반려 처리에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="list-page">
      <div className="page-header">
        <h1 className="page-title">작가 인증 관리</h1>
        <span className="total-count">총 {data.totalElements?.toLocaleString()}건</span>
      </div>

      <div className="verification-tabs">
        {[
          { key: 'PENDING', label: `신청 대기 (${counts.PENDING || 0})` },
          { key: 'APPROVED', label: `승인됨 (${counts.APPROVED || 0})` },
          { key: 'REJECTED', label: `반려됨 (${counts.REJECTED || 0})` },
        ].map(t => (
          <button
            key={t.key}
            className={`verification-tab${status === t.key ? ' active' : ''}`}
            onClick={() => { setStatus(t.key); setPage(0); }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>신청자</th><th>이메일</th><th>프로필명</th>
              <th>포트폴리오</th><th>소개</th><th>신청일</th><th>상태</th>
              {status === 'PENDING' && <th>처리</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="loading-cell">로딩 중...</td></tr>
            ) : data.content.length === 0 ? (
              <tr><td colSpan="8" className="loading-cell">신청 내역이 없습니다.</td></tr>
            ) : data.content.map(v => (
              <tr key={v.id}>
                <td className="name-cell">{v.memberName}</td>
                <td>{v.memberEmail}</td>
                <td>{v.memberProfileName || '-'}</td>
                <td>
                  {v.portfolioUrl
                    ? <a href={v.portfolioUrl} target="_blank" rel="noopener noreferrer" className="portfolio-link">링크 ↗</a>
                    : '-'
                  }
                </td>
                <td className="bio-cell">{v.bio || '-'}</td>
                <td>{v.createdAt?.slice(0, 10)}</td>
                <td>
                  <span className={`badge ${STATUS_CLASSES[v.status] || 'badge-gray'}`}>
                    {STATUS_LABELS[v.status] || v.status}
                  </span>
                  {v.status === 'REJECTED' && v.rejectReason && (
                    <div className="reject-reason-tip">{v.rejectReason}</div>
                  )}
                </td>
                {status === 'PENDING' && (
                  <td>
                    <div className="action-cell">
                      <button className="btn-sm btn-outline" onClick={() => handleApprove(v.id, v.memberName)} disabled={processing}>승인</button>
                      <button className="btn-sm btn-danger-outline" onClick={() => { setRejectModal(v); setRejectReason(''); }} disabled={processing}>반려</button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />

      {rejectModal && (
        <div className="modal-overlay" onClick={() => !processing && setRejectModal(null)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-icon warning">!</div>
            <h3 className="modal-title">인증 반려</h3>
            <p className="modal-desc">{rejectModal.memberName}({rejectModal.memberEmail})의 인증 신청을 반려합니다.</p>
            <label className="modal-label">반려 사유 (필수)</label>
            <textarea
              className="modal-textarea"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="반려 사유를 입력하세요"
              rows={3}
            />
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setRejectModal(null)} disabled={processing}>취소</button>
              <button className="btn-danger-modal" onClick={handleRejectConfirm} disabled={!rejectReason.trim() || processing}>
                {processing ? '처리 중...' : '반려 처리'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationListPage;

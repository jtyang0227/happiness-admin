import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getApi, postApi } from '../utils/api';
import { useConfirm } from '../context/ConfirmContext';
import Pagination from '../components/common/Pagination';
import './ReportListPage.css';

const STATUS_LABELS = { PENDING: '대기중', IN_REVIEW: '검토중', ACTION_TAKEN: '처리완료', DISMISSED: '기각' };
const STATUS_CLASSES = { PENDING: 'badge-red', IN_REVIEW: 'badge-yellow', ACTION_TAKEN: 'badge-green', DISMISSED: 'badge-gray' };
const TARGET_LABELS = { PHOTO: '사진', MEMBER: '회원', SERIES: '시리즈' };

const ACTIONS = [
  { value: 'DISMISS', label: '기각 (신고 내용 부적절)' },
  { value: 'HIDE_CONTENT', label: '콘텐츠 숨김 (앱 비노출)' },
  { value: 'DELETE_CONTENT', label: '콘텐츠 삭제 (영구)' },
  { value: 'WARN_AUTHOR', label: '작성자 경고' },
  { value: 'SUSPEND_AUTHOR', label: '작성자 정지' },
];

const ReportListPage = () => {
  const { confirm } = useConfirm();
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [counts, setCounts] = useState({});
  const [status, setStatus] = useState('');
  const [targetType, setTargetType] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [action, setAction] = useState('DISMISS');
  const [memo, setMemo] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, size: 20 });
    if (status) params.set('status', status);
    if (targetType) params.set('targetType', targetType);
    Promise.all([
      getApi(`/admin/reports?${params}`),
      getApi('/admin/reports/counts'),
    ]).then(([d, c]) => { setData(d); setCounts(c); })
      .finally(() => setLoading(false));
  }, [page, status, targetType]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openReview = (report) => { setSelected(report); setAction('DISMISS'); setMemo(''); };

  const handleProcess = async () => {
    const ok = await confirm({
      title: '신고 처리',
      description: `선택한 조치(${ACTIONS.find(a => a.value === action)?.label})를 실행하시겠습니까?`,
      variant: action === 'DISMISS' ? 'warning' : 'danger',
    });
    if (!ok) return;
    setProcessing(true);
    try {
      await postApi(`/admin/reports/${selected.id}/process`, { action, memo });
      toast.success('신고가 처리되었습니다.');
      setSelected(null);
      fetchData();
    } catch {
      toast.error('처리에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="list-page">
      <div className="page-header">
        <h1 className="page-title">신고 관리</h1>
        <span className="total-count">총 {data.totalElements?.toLocaleString()}건</span>
      </div>

      <div className="report-counts">
        {[
          { key: 'PENDING', label: '대기 중', cls: 'count-red' },
          { key: 'IN_REVIEW', label: '검토 중', cls: 'count-yellow' },
          { key: 'ACTION_TAKEN', label: '처리 완료', cls: 'count-green' },
          { key: 'DISMISSED', label: '기각', cls: 'count-gray' },
        ].map(({ key, label, cls }) => (
          <button
            key={key}
            className={`count-card ${cls} ${status === key ? 'active' : ''}`}
            onClick={() => { setStatus(status === key ? '' : key); setPage(0); }}
          >
            <div className="count-num">{counts[key] || 0}</div>
            <div className="count-label">{label}</div>
          </button>
        ))}
      </div>

      <div className="filter-bar">
        <select className="filter-select" value={targetType} onChange={e => { setTargetType(e.target.value); setPage(0); }}>
          <option value="">전체 유형</option>
          <option value="PHOTO">사진</option>
          <option value="MEMBER">회원</option>
          <option value="SERIES">시리즈</option>
        </select>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr><th>신고자</th><th>대상 유형</th><th>신고 사유</th><th>접수일</th><th>상태</th><th>처리</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="loading-cell">로딩 중...</td></tr>
            ) : data.content.length === 0 ? (
              <tr><td colSpan="6" className="loading-cell">신고 내역이 없습니다.</td></tr>
            ) : data.content.map(r => (
              <tr key={r.id} className={r.status === 'PENDING' ? 'row-pending' : ''}>
                <td>{r.reporterName || '(탈퇴 회원)'}</td>
                <td><span className="notice-type-badge">{TARGET_LABELS[r.targetType] || r.targetType} #{r.targetId}</span></td>
                <td className="name-cell">{r.reason}</td>
                <td>{r.createdAt?.slice(0, 10)}</td>
                <td><span className={`badge ${STATUS_CLASSES[r.status] || 'badge-gray'}`}>{STATUS_LABELS[r.status] || r.status}</span></td>
                <td>
                  {(r.status === 'PENDING' || r.status === 'IN_REVIEW') && (
                    <button className="btn-sm btn-outline" onClick={() => openReview(r)}>검토</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />

      {selected && (
        <div className="modal-overlay" onClick={() => !processing && setSelected(null)}>
          <div className="report-review-dialog" onClick={e => e.stopPropagation()}>
            <div className="review-header">
              <h3 className="modal-title">신고 #{selected.id} 검토</h3>
              <button className="review-close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="review-info-grid">
              <div><span className="review-label">신고자</span><span className="review-val">{selected.reporterName} ({selected.reporterEmail})</span></div>
              <div><span className="review-label">신고 유형</span><span className="review-val">{selected.reason}</span></div>
              <div><span className="review-label">대상</span><span className="review-val">{TARGET_LABELS[selected.targetType]} #{selected.targetId}</span></div>
              {selected.details && (
                <div className="review-details"><span className="review-label">상세 내용</span><p className="review-val">{selected.details}</p></div>
              )}
            </div>
            <div className="review-section">
              <p className="review-label">처리 방법</p>
              {ACTIONS.map(a => (
                <label key={a.value} className="review-radio">
                  <input type="radio" name="action" value={a.value} checked={action === a.value} onChange={() => setAction(a.value)} />
                  {a.label}
                </label>
              ))}
            </div>
            <div className="review-section">
              <label className="modal-label">처리 메모</label>
              <textarea
                className="modal-textarea"
                value={memo}
                onChange={e => setMemo(e.target.value)}
                placeholder="처리 내용을 기록하세요 (선택)"
                rows={3}
              />
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setSelected(null)} disabled={processing}>취소</button>
              <button className="btn-danger-modal" onClick={handleProcess} disabled={processing}>
                {processing ? '처리 중...' : '처리 완료'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportListPage;

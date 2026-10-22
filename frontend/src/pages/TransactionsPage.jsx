import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AlertTriangle, Lock } from 'lucide-react';
import { getApi } from '../utils/api';
import Pagination from '../components/common/Pagination';
import SegmentedControl from '../components/common/SegmentedControl';
import './TransactionsPage.css';

const MEET_STATUS = {
  PENDING: ['요청됨', 'badge-yellow'], NEGOTIATING: ['조율 중', 'badge-blue'], CONFIRMED: ['확정', 'badge-purple'],
  COMPLETED: ['완료', 'badge-green'], CANCELLED: ['취소', 'badge-draft'],
};
const DELIVERY_STATUS = {
  PENDING: ['승인 대기', 'badge-yellow'], APPROVED: ['승인', 'badge-green'], REJECTED: ['반려', 'badge-red'],
};

const formatDate = (v) => (v ? String(v).slice(0, 10) : '-');
const daysSince = (v) => Math.max(0, Math.floor((Date.now() - new Date(v).getTime()) / 86400000));
const daysUntil = (v) => Math.ceil((new Date(v).getTime() - Date.now()) / 86400000);

const StatusBadge = ({ map, status }) => {
  const [label, cls] = map[status] || [status, 'badge-draft'];
  return <span className={`badge ${cls}`}>{label}</span>;
};

const MemberLink = ({ id, name }) => (id ? <Link to={`/members/${id}`} className="tx-member">{name || `#${id}`}</Link> : '-');

const TransactionsPage = () => {
  const [kind, setKind] = useState('meets');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [summary, setSummary] = useState(null);
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getApi('/admin/transactions/summary').then(setSummary).catch(() => toast.error('운영 현황을 불러오지 못했습니다.'));
  }, []);

  const fetchList = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, size: 20 });
    if (status) params.set('status', status);
    getApi(`/admin/transactions/${kind}?${params}`)
      .then(setData)
      .catch(() => toast.error('목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [kind, status, page]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const statusMap = kind === 'meets' ? MEET_STATUS : DELIVERY_STATUS;
  const counts = (kind === 'meets' ? summary?.meetCounts : summary?.deliveryCounts) || {};
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="list-page">
      <div className="page-header">
        <h1 className="page-title">미팅·납품 현황</h1>
        <span className="total-count">작가↔고객 거래 진행 상태 (읽기 전용)</span>
      </div>

      <div className="tx-privacy">
        <Lock size={14} />
        메시지·주소·사진·고객 피드백 같은 거래 내용은 표시하지 않습니다. 정체 건은 작가에게 안내하는 용도로만 확인하세요.
      </div>

      <div className="tx-alerts">
        <section className="tx-alert-card">
          <h2 className="tx-alert-title">
            <AlertTriangle size={14} /> {summary?.meetStallDays ?? 7}일 넘게 응답 없는 미팅
            <span className="tx-alert-count">{summary?.stalledMeets?.length ?? 0}</span>
          </h2>
          {summary?.stalledMeets?.length ? (
            <ul className="tx-alert-list">
              {summary.stalledMeets.map(m => (
                <li key={m.id}>
                  <span><MemberLink id={m.requesterId} name={m.requesterName} /> → <MemberLink id={m.receiverId} name={m.receiverName} /></span>
                  <span className="tx-alert-meta"><StatusBadge map={MEET_STATUS} status={m.status} /> {daysSince(m.updatedAt)}일째</span>
                </li>
              ))}
            </ul>
          ) : <div className="tx-alert-empty">정체된 미팅이 없습니다.</div>}
        </section>
        <section className="tx-alert-card">
          <h2 className="tx-alert-title">
            <AlertTriangle size={14} /> 만료됐거나 {summary?.deliveryExpiryWarnDays ?? 3}일 내 만료되는 미승인 납품
            <span className="tx-alert-count">{summary?.expiringDeliveries?.length ?? 0}</span>
          </h2>
          {summary?.expiringDeliveries?.length ? (
            <ul className="tx-alert-list">
              {summary.expiringDeliveries.map(d => (
                <li key={d.id}>
                  <span><MemberLink id={d.memberId} name={d.memberName} /> · {d.title}</span>
                  <span className={`tx-alert-meta${d.expired ? ' tx-expired' : ''}`}>
                    {d.expired ? '만료됨' : `D-${daysUntil(d.expiresAt)}`}{!d.viewed && ' · 미열람'}
                  </span>
                </li>
              ))}
            </ul>
          ) : <div className="tx-alert-empty">만료 위험 납품이 없습니다.</div>}
        </section>
      </div>

      <div className="tx-toolbar">
        <SegmentedControl
          ariaLabel="거래 종류"
          value={kind}
          onChange={(v) => { setKind(v); setStatus(''); setPage(0); }}
          options={[{ value: 'meets', label: '미팅' }, { value: 'deliveries', label: '납품' }]}
        />
        <SegmentedControl
          ariaLabel="상태"
          value={status}
          onChange={(v) => { setStatus(v); setPage(0); }}
          options={[{ value: '', label: '전체', count: total },
            ...Object.keys(statusMap).map(k => ({ value: k, label: statusMap[k][0], count: counts[k] ?? 0 }))]}
        />
      </div>

      <div className="table-card">
        <table className="data-table">
          {kind === 'meets' ? (
            <>
              <thead><tr><th>요청자</th><th>작가</th><th>상태</th><th>확정일</th><th>요청일</th><th>마지막 변경</th></tr></thead>
              <tbody>
                {loading && data.content.length === 0 ? (
                  <tr><td colSpan="6" className="loading-cell">로딩 중...</td></tr>
                ) : data.content.length === 0 ? (
                  <tr><td colSpan="6" className="loading-cell">미팅이 없습니다.</td></tr>
                ) : data.content.map(m => (
                  <tr key={m.id}>
                    <td><MemberLink id={m.requesterId} name={m.requesterName} /></td>
                    <td><MemberLink id={m.receiverId} name={m.receiverName} /></td>
                    <td><StatusBadge map={MEET_STATUS} status={m.status} /></td>
                    <td>{formatDate(m.confirmedDate)}</td>
                    <td>{formatDate(m.createdAt)}</td>
                    <td>{formatDate(m.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </>
          ) : (
            <>
              <thead><tr><th>납품명</th><th>작가</th><th>고객</th><th>상태</th><th>고객 열람</th><th>만료</th></tr></thead>
              <tbody>
                {loading && data.content.length === 0 ? (
                  <tr><td colSpan="6" className="loading-cell">로딩 중...</td></tr>
                ) : data.content.length === 0 ? (
                  <tr><td colSpan="6" className="loading-cell">납품이 없습니다.</td></tr>
                ) : data.content.map(d => (
                  <tr key={d.id}>
                    <td className="name-cell">{d.title}</td>
                    <td><MemberLink id={d.memberId} name={d.memberName} /></td>
                    <td>{d.clientName || '-'}</td>
                    <td><StatusBadge map={DELIVERY_STATUS} status={d.status} /></td>
                    <td>{d.viewed ? '열람함' : '미열람'}</td>
                    <td className={d.expired && d.status === 'PENDING' ? 'tx-expired' : ''}>{formatDate(d.expiresAt)}{d.expired && ' (만료)'}</td>
                  </tr>
                ))}
              </tbody>
            </>
          )}
        </table>
      </div>
      <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
    </div>
  );
};

export default TransactionsPage;

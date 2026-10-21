import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getApi } from '../utils/api';
import Pagination from '../components/common/Pagination';
import SegmentedControl from '../components/common/SegmentedControl';
import './SecurityAuditPage.css';

const TYPE_LABELS = {
  LOGIN_FAILURE: '로그인 실패', LOGIN_SUCCESS: '로그인 성공', ADMIN_API: '관리자 API', SERVICE: '서비스 동작',
};
const TYPE_BADGES = {
  LOGIN_FAILURE: 'badge-red', LOGIN_SUCCESS: 'badge-green', ADMIN_API: 'badge-purple', SERVICE: 'badge-blue',
};
const PERIODS = [
  { value: 1, label: '24시간' },
  { value: 7, label: '7일' },
  { value: 30, label: '30일' },
];

const formatDateTime = (v) => (v ? v.slice(0, 19).replace('T', ' ') : '-');

const SecurityAuditPage = () => {
  const [summary, setSummary] = useState(null);
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [type, setType] = useState('');
  const [failedOnly, setFailedOnly] = useState(false);
  const [days, setDays] = useState(7);
  const [ip, setIp] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ days, page, size: 30 });
    if (type) params.set('actionType', type);
    if (failedOnly) params.set('success', 'false');
    if (ip) params.set('ip', ip);
    getApi(`/admin/security-audit?${params}`)
      .then(setData)
      .catch(() => toast.error('감사 로그를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [type, failedOnly, days, ip, page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  useEffect(() => {
    getApi('/admin/security-audit/summary').then(setSummary).catch(() => {});
  }, []);

  const resetPage = (fn) => (v) => { fn(v); setPage(0); };

  return (
    <div className="list-page">
      <div className="page-header">
        <h1 className="page-title">보안 감사 로그</h1>
        <span className="total-count">App 로그인·관리자 API·민감 동작 기록 (읽기 전용)</span>
      </div>

      <div className="audit-summary">
        <div className={`audit-kpi${summary?.loginFailures24h > 0 ? ' audit-kpi--alert' : ''}`}>
          <div className="audit-kpi-value">{summary?.loginFailures24h ?? '-'}</div>
          <div className="audit-kpi-label">로그인 실패 · 24시간</div>
        </div>
        <div className="audit-kpi">
          <div className="audit-kpi-value">{summary?.loginSuccess24h ?? '-'}</div>
          <div className="audit-kpi-label">로그인 성공 · 24시간</div>
        </div>
        <div className="audit-kpi">
          <div className="audit-kpi-value">{summary?.adminApi7d ?? '-'}</div>
          <div className="audit-kpi-label">관리자 API 호출 · 7일</div>
        </div>
        <div className="audit-ips">
          <div className="audit-ips-title">로그인 실패 상위 IP · 24시간</div>
          {summary?.topFailureIps?.length ? (
            <ul>
              {summary.topFailureIps.map(r => (
                <li key={r.ip}>
                  <button type="button" className="audit-ip-link" onClick={() => { setIp(r.ip); setType('LOGIN_FAILURE'); setDays(1); setPage(0); }}>
                    {r.ip}
                  </button>
                  <span className="audit-ip-count">{r.count}회</span>
                </li>
              ))}
            </ul>
          ) : <div className="audit-ips-empty">없음</div>}
        </div>
      </div>

      <div className="audit-toolbar">
        <SegmentedControl
          ariaLabel="로그 유형"
          value={type}
          onChange={resetPage(setType)}
          options={[{ value: '', label: '전체' }, ...Object.keys(TYPE_LABELS).map(k => ({ value: k, label: TYPE_LABELS[k] }))]}
        />
        <SegmentedControl ariaLabel="기간" value={days} onChange={resetPage(setDays)} options={PERIODS} />
        <label className="audit-check">
          <input type="checkbox" checked={failedOnly} onChange={e => { setFailedOnly(e.target.checked); setPage(0); }} />
          실패만
        </label>
        {ip && (
          <span className="audit-ip-filter">
            IP {ip}
            <button type="button" aria-label="IP 필터 해제" onClick={() => { setIp(''); setPage(0); }}>×</button>
          </span>
        )}
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr><th>시각</th><th>유형</th><th>회원</th><th>내용</th><th>IP</th><th>결과</th></tr>
          </thead>
          <tbody>
            {loading && data.content.length === 0 ? (
              <tr><td colSpan="6" className="loading-cell">로딩 중...</td></tr>
            ) : data.content.length === 0 ? (
              <tr><td colSpan="6" className="loading-cell">조건에 맞는 로그가 없습니다.</td></tr>
            ) : data.content.map(l => (
              <tr key={l.id}>
                <td className="audit-mono">{formatDateTime(l.createdAt)}</td>
                <td><span className={`badge ${TYPE_BADGES[l.actionType] || 'badge-draft'}`}>{TYPE_LABELS[l.actionType] || l.actionType}</span></td>
                <td>{l.memberName || (l.memberId ? `#${l.memberId}` : '-')}{l.role && <span className="audit-role">{l.role}</span>}</td>
                <td className="audit-detail" title={l.errorMessage || l.actionDetail}>
                  {l.actionDetail || '-'}
                  {l.errorMessage && <div className="audit-error">{l.errorMessage}</div>}
                </td>
                <td className="audit-mono">{l.ipAddress || '-'}</td>
                <td>{l.success ? <span className="badge badge-green">성공</span> : <span className="badge badge-red">실패</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
    </div>
  );
};

export default SecurityAuditPage;

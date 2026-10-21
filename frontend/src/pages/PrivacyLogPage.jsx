import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { getApi, postApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/common/Pagination';
import SegmentedControl from '../components/common/SegmentedControl';
import ReasonDialog from '../components/common/ReasonDialog';
import './PrivacyLogPage.css';

const ACTION_LABELS = { LIST: '목록 조회', VIEW: '상세 조회', REVEAL: '원문 열람', EXPORT: '다운로드', INSPECTION: '점검' };
const ACTION_BADGES = { LIST: 'badge-draft', VIEW: 'badge-blue', REVEAL: 'badge-yellow', EXPORT: 'badge-red', INSPECTION: 'badge-green' };
const PERIODS = [{ value: 7, label: '7일' }, { value: 30, label: '30일' }, { value: 365, label: '1년' }, { value: 730, label: '2년' }];
const fmt = (v) => (v ? v.slice(0, 19).replace('T', ' ') : '-');

const PrivacyLogPage = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [action, setAction] = useState('');
  const [days, setDays] = useState(30);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [integrity, setIntegrity] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [inspectOpen, setInspectOpen] = useState(false);
  const [inspecting, setInspecting] = useState(false);

  const isWm = user?.authority === 'WM';

  const fetchAll = useCallback(() => {
    if (!isWm) return;
    setLoading(true);
    const params = new URLSearchParams({ days, page, size: 30 });
    if (action) params.set('action', action);
    Promise.all([getApi(`/admin/privacy-logs?${params}`), getApi('/admin/privacy-logs/summary')])
      .then(([d, s]) => { setData(d); setSummary(s); })
      .catch(e => toast.error(e.message || '접속기록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [action, days, page, isWm]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleVerify = async () => {
    setVerifying(true);
    try {
      setIntegrity(await getApi('/admin/privacy-logs/verify'));
    } catch (e) {
      toast.error(e.message || '검증에 실패했습니다.');
    } finally {
      setVerifying(false);
    }
  };

  const handleInspect = async (note) => {
    setInspecting(true);
    try {
      await postApi('/admin/privacy-logs/inspections', { note });
      toast.success('점검 기록을 남겼습니다.');
      setInspectOpen(false);
      fetchAll();
    } catch (e) {
      toast.error(e.message || '기록에 실패했습니다.');
    } finally {
      setInspecting(false);
    }
  };

  if (!isWm) {
    return (
      <div className="list-page">
        <div className="page-header"><h1 className="page-title">개인정보 접속기록</h1></div>
        <div className="empty-state">개인정보 접속기록은 웹관리자(개인정보 보호책임자)만 열람할 수 있습니다.</div>
      </div>
    );
  }

  const counts = summary?.counts30d || {};

  return (
    <div className="list-page">
      <div className="page-header">
        <h1 className="page-title">개인정보 접속기록</h1>
        <span className="total-count">개인정보 열람·다운로드 기록 · 위·변조 방지 해시 체인 · {summary?.retentionYears ?? 2}년 이상 보관</span>
        <button type="button" className="btn btn-md btn-primary pl-inspect" onClick={() => setInspectOpen(true)}>점검 완료 기록</button>
      </div>

      <div className="pl-summary">
        {['VIEW', 'REVEAL', 'EXPORT'].map(k => (
          <div key={k} className={`pl-kpi${k === 'EXPORT' && counts[k] > 0 ? ' pl-kpi--alert' : ''}`}>
            <div className="pl-kpi-value">{counts[k] ?? '-'}</div>
            <div className="pl-kpi-label">{ACTION_LABELS[k]} · 30일</div>
          </div>
        ))}
        <div className="pl-kpi">
          <div className="pl-kpi-value pl-kpi-small">{summary?.lastInspection ? fmt(summary.lastInspection.accessedAt).slice(0, 10) : '기록 없음'}</div>
          <div className="pl-kpi-label">마지막 점검{summary?.lastInspection ? ` · ${summary.lastInspection.adminName}` : ''}</div>
        </div>
        <div className={`pl-integrity${integrity ? (integrity.valid ? ' ok' : ' broken') : ''}`}>
          {integrity
            ? integrity.valid
              ? <><ShieldCheck size={16} /> 무결성 정상 · {integrity.total.toLocaleString()}건</>
              : <><AlertTriangle size={16} /> 변조 의심 · #{integrity.brokenAtId}부터 체인 불일치</>
            : '무결성 미검증'}
          <button type="button" className="btn btn-outline btn-sm" onClick={handleVerify} disabled={verifying}>
            {verifying ? '검증 중...' : '무결성 검증'}
          </button>
        </div>
      </div>

      <div className="pl-toolbar">
        <SegmentedControl
          ariaLabel="수행업무"
          value={action}
          onChange={(v) => { setAction(v); setPage(0); }}
          options={[{ value: '', label: '전체' }, ...Object.keys(ACTION_LABELS).map(k => ({ value: k, label: ACTION_LABELS[k] }))]}
        />
        <SegmentedControl ariaLabel="기간" value={days} onChange={(v) => { setDays(v); setPage(0); }} options={PERIODS} />
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead><tr><th>접속일시</th><th>관리자</th><th>접속지(IP)</th><th>수행업무</th><th>정보주체</th><th>사유·내용</th></tr></thead>
          <tbody>
            {loading && data.content.length === 0 ? (
              <tr><td colSpan="6" className="loading-cell">로딩 중...</td></tr>
            ) : data.content.length === 0 ? (
              <tr><td colSpan="6" className="loading-cell">기록이 없습니다.</td></tr>
            ) : data.content.map(l => (
              <tr key={l.id} className={l.action === 'EXPORT' ? 'pl-row-export' : ''}>
                <td className="pl-mono">{fmt(l.accessedAt)}</td>
                <td>{l.adminName || '-'}</td>
                <td className="pl-mono">{l.ipAddress || '-'}</td>
                <td><span className={`badge ${ACTION_BADGES[l.action] || 'badge-draft'}`}>{ACTION_LABELS[l.action] || l.action}</span></td>
                <td>
                  {l.subjectMemberId
                    ? <Link to={`/members/${l.subjectMemberId}`} className="pl-subject">회원 #{l.subjectMemberId}</Link>
                    : l.subjectCount != null ? `${l.subjectCount.toLocaleString()}명` : '-'}
                </td>
                <td className="pl-detail">
                  {l.reason && <div className="pl-reason">{l.reason}</div>}
                  <div className="pl-detail-text">{l.detail}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />

      <ReasonDialog
        open={inspectOpen}
        title="접속기록 점검 완료 기록"
        description="내부 관리계획에 따라 접속기록과 다운로드 내역을 점검했음을 남깁니다. 점검 범위와 결과를 적어 주세요."
        confirmLabel="기록 남기기"
        busy={inspecting}
        onSubmit={handleInspect}
        onClose={() => setInspectOpen(false)}
      />
    </div>
  );
};

export default PrivacyLogPage;

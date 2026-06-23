import React, { useEffect, useState, useCallback } from 'react';
import { getApi } from '../utils/api';
import './SystemPage.css';

const StatusCard = ({ title, items }) => (
  <div className="system-card">
    <h2 className="system-card-title">{title}</h2>
    <div className="system-items">
      {items.map(({ label, value, status }) => (
        <div key={label} className="system-item">
          <span className="system-label">{label}</span>
          <span className={`system-value ${status}`}>{value}</span>
        </div>
      ))}
    </div>
  </div>
);

const ACTION_LABELS = {
  MEMBER_SUSPEND: '회원 정지',
  MEMBER_ACTIVATE: '정지 해제',
  MEMBER_DELETE: '회원 삭제',
  ROLE_UPDATE: '역할 변경',
  PHOTO_DELETE: '사진 삭제',
  NOTICE_PUBLISH: '공지 발행',
  NOTICE_DELETE: '공지 삭제',
  BANNER_CREATE: '배너 생성',
  BANNER_DELETE: '배너 삭제',
  REPORT_PROCESS: '신고 처리',
  VERIFICATION_APPROVE: '작가 인증 승인',
  VERIFICATION_REJECT: '작가 인증 반려',
};

const SystemPage = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [logsPage, setLogsPage] = useState(0);
  const [logsTotalPages, setLogsTotalPages] = useState(0);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    getApi('/admin/system/status').then(setStatus).finally(() => setLoading(false));
  }, []);

  const loadLogs = useCallback(async (page) => {
    setLogsLoading(true);
    try {
      const data = await getApi(`/admin/system/activity-logs?page=${page}&size=15`);
      setLogs(data.content || []);
      setLogsTotalPages(data.totalPages || 0);
      setLogsPage(page);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => { loadLogs(0); }, [loadLogs]);

  if (loading) return <div className="page-loading">로딩 중...</div>;

  return (
    <div className="system-page">
      <h1 className="page-title">시스템 설정</h1>
      <div className="system-grid">
        <StatusCard title="이메일 설정" items={[
          { label: 'MAIL_HOST', value: status?.mailHost, status: status?.mailConfigured ? 'ok' : 'warn' },
          { label: '계정', value: status?.mailUsername, status: status?.mailConfigured ? 'ok' : 'warn' },
          { label: '설정 상태', value: status?.mailConfigured ? '✅ 설정됨' : '⚠️ 미설정', status: status?.mailConfigured ? 'ok' : 'warn' },
        ]} />
        <StatusCard title="Rate Limit" items={[
          { label: '최대 요청', value: `${status?.rateLimitCapacity} 토큰`, status: 'ok' },
          { label: '리필 토큰', value: status?.rateLimitRefillTokens, status: 'ok' },
          { label: '리필 주기', value: `${status?.rateLimitRefillSeconds}초`, status: 'ok' },
        ]} />
        <StatusCard title="데이터베이스" items={[
          { label: 'DB 종류', value: status?.dbType, status: 'ok' },
          { label: '활성 프로필', value: status?.activeProfile, status: 'ok' },
        ]} />
      </div>

      <div className="system-card" style={{ marginTop: 20 }}>
        <h2 className="system-card-title">관리자 활동 로그</h2>
        {logsLoading ? (
          <div className="loading-cell">로딩 중...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>시각</th><th>관리자</th><th>액션</th><th>대상</th><th>상세</th></tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan="5" className="loading-cell">활동 로그가 없습니다.</td></tr>
              ) : logs.map(log => (
                <tr key={log.id}>
                  <td style={{ fontSize: 12, color: 'var(--color-text-2)' }}>{log.createdAt?.replace('T', ' ').slice(0, 16)}</td>
                  <td>{log.adminName}</td>
                  <td>
                    <span className="badge badge-blue">{ACTION_LABELS[log.action] || log.action}</span>
                  </td>
                  <td style={{ fontSize: 12 }}>{log.targetType && `${log.targetType} #${log.targetId}`}</td>
                  <td style={{ fontSize: 12, color: 'var(--color-text-2)' }}>{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {logsTotalPages > 1 && (
          <div className="sys-log-pagination">
            <button disabled={logsPage === 0} onClick={() => loadLogs(logsPage - 1)} className="page-btn">이전</button>
            <span style={{ fontSize: 13 }}>{logsPage + 1} / {logsTotalPages}</span>
            <button disabled={logsPage >= logsTotalPages - 1} onClick={() => loadLogs(logsPage + 1)} className="page-btn">다음</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemPage;

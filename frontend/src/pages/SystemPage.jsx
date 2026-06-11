import React, { useEffect, useState } from 'react';
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

const SystemPage = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getApi('/admin/system/status').then(setStatus).finally(() => setLoading(false));
  }, []);

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
    </div>
  );
};

export default SystemPage;

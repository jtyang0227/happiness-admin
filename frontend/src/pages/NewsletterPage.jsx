import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Download } from 'lucide-react';
import { getApi, postApi } from '../utils/api';
import { csvCell } from '../utils/csv';
import Pagination from '../components/common/Pagination';
import SegmentedControl from '../components/common/SegmentedControl';
import ReasonDialog from '../components/common/ReasonDialog';
import './NewsletterPage.css';

const formatDate = (v) => (v ? v.slice(0, 10) : '-');

const NewsletterPage = () => {
  const [status, setStatus] = useState('active');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, size: 30 });
    if (status) params.set('active', status === 'active');
    if (query) params.set('search', query);
    Promise.all([
      getApi(`/admin/newsletter?${params}`),
      getApi('/admin/newsletter/counts'),
    ]).then(([d, c]) => { setData(d); setCounts(c); })
      .catch(() => toast.error('구독자 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [status, page, query]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const t = setTimeout(() => { setQuery(search.trim()); setPage(0); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleExport = async (reason) => {
    setExporting(true);
    try {
      const rows = await postApi('/admin/newsletter/export', { reason });
      const csv = ['email,name,subscribed_at', ...rows.map(r => [r.email, r.memberName, r.subscribedAt].map(csvCell).join(','))].join('\n');
      const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${rows.length}명을 내보냈습니다.`);
      setExportOpen(false);
    } catch (e) {
      toast.error(e.message || '내보내기에 실패했습니다.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="list-page">
      <div className="page-header">
        <h1 className="page-title">뉴스레터 구독자</h1>
        <span className="total-count">App 작가 소식 구독 현황</span>
        <button type="button" className="btn btn-md btn-primary nl-export" onClick={() => setExportOpen(true)} disabled={exporting || !counts.active}>
          <Download size={14} /> {exporting ? '내보내는 중...' : 'CSV 내보내기'}
        </button>
      </div>

      <div className="nl-kpis">
        <div className="nl-kpi"><div className="nl-kpi-value">{counts.active ?? '-'}</div><div className="nl-kpi-label">구독 중</div></div>
        <div className="nl-kpi">
          <div className={`nl-kpi-value${counts.new7d > 0 ? ' nl-up' : ''}`}>{counts.new7d > 0 ? `+${counts.new7d}` : counts.new7d ?? '-'}</div>
          <div className="nl-kpi-label">7일 신규</div>
        </div>
        <div className="nl-kpi">
          <div className={`nl-kpi-value${counts.unsubscribed7d > 0 ? ' nl-down' : ''}`}>{counts.unsubscribed7d > 0 ? `−${counts.unsubscribed7d}` : counts.unsubscribed7d ?? '-'}</div>
          <div className="nl-kpi-label">7일 해지</div>
        </div>
        <div className="nl-kpi"><div className="nl-kpi-value">{counts.unsubscribed ?? '-'}</div><div className="nl-kpi-label">누적 해지</div></div>
      </div>

      <div className="nl-toolbar">
        <SegmentedControl
          ariaLabel="구독 상태"
          value={status}
          onChange={(v) => { setStatus(v); setPage(0); }}
          options={[
            { value: 'active', label: '구독 중', count: counts.active },
            { value: 'unsubscribed', label: '해지', count: counts.unsubscribed },
            { value: '', label: '전체' },
          ]}
        />
        <input className="search-input" placeholder="이메일 검색" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead><tr><th>이메일</th><th>회원</th><th>구독일</th><th>해지일</th><th>상태</th></tr></thead>
          <tbody>
            {loading && data.content.length === 0 ? (
              <tr><td colSpan="5" className="loading-cell">로딩 중...</td></tr>
            ) : data.content.length === 0 ? (
              <tr><td colSpan="5" className="loading-cell">구독자가 없습니다.</td></tr>
            ) : data.content.map(s => (
              <tr key={s.id}>
                <td className="name-cell">{s.email}</td>
                <td><Link to={`/members/${s.memberId}`} className="nl-member">{s.memberName || `#${s.memberId}`}</Link></td>
                <td>{formatDate(s.subscribedAt)}</td>
                <td>{formatDate(s.unsubscribedAt)}</td>
                <td>{s.active ? <span className="badge badge-green">구독 중</span> : <span className="badge badge-draft">해지</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
      <ReasonDialog
        open={exportOpen}
        title="구독자 CSV 내보내기"
        description={`활성 구독자 ${counts.active ?? 0}명의 이메일을 내려받습니다. 발송 목적 외 사용을 금합니다.`}
        confirmLabel="내려받기"
        busy={exporting}
        onSubmit={handleExport}
        onClose={() => setExportOpen(false)}
      />
    </div>
  );
};

export default NewsletterPage;

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ListOrdered } from 'lucide-react';
import { getApi, deleteApi, patchApi } from '../utils/api';
import { useConfirm } from '../context/ConfirmContext';
import Pagination from '../components/common/Pagination';
import ImgWithFallback from '../components/common/ImgWithFallback';
import SlideOver from '../components/common/SlideOver';
import './PortfolioListPage.css';

const STATUS_LABELS = { DRAFT: '임시저장', PENDING: '심사 중', APPROVED: '승인', REJECTED: '반려' };
const STATUS_BADGE = { DRAFT: 'badge-draft', PENDING: 'badge-pending', APPROVED: 'badge-approved', REJECTED: 'badge-rejected' };
const VISIBILITY_BADGE = { PUBLIC: 'badge-public', PRIVATE: 'badge-private', UNLISTED: 'badge-unlisted' };
const VISIBILITY_LABELS = { PUBLIC: '공개', PRIVATE: '비공개', UNLISTED: '일부공개' };

const StatCard = ({ label, value, active, onClick }) => (
  <button className={`pf-stat-card ${active ? 'active' : ''}`} onClick={onClick}>
    <span className="pf-stat-value">{value ?? '-'}</span>
    <span className="pf-stat-label">{label}</span>
  </button>
);

const PortfolioListPage = () => {
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();

  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState(searchParams.get('search') || '');
  const [slidePortfolio, setSlidePortfolio] = useState(null);
  const [noteInput, setNoteInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const searchTimerRef = useRef(null);

  const search     = searchParams.get('search')     || '';
  const status     = searchParams.get('status')     || '';
  const visibility = searchParams.get('visibility') || '';
  const sortBy     = searchParams.get('sortBy')     || 'latest';
  const page       = parseInt(searchParams.get('page') || '0', 10);

  const updateParams = useCallback((updates) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([k, v]) => {
        if (v === '' || v === null || v === undefined) next.delete(k);
        else next.set(k, String(v));
      });
      return next;
    });
  }, [setSearchParams]);

  const fetchStats = useCallback(() => {
    getApi('/admin/portfolios/stats').then(setStats).catch(() => {});
  }, []);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, size: 20 });
    if (status)     params.set('status', status);
    if (visibility) params.set('visibility', visibility);
    if (search)     params.set('search', search);
    getApi(`/admin/portfolios?${params}`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [page, status, visibility, search]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const openSlide = (p) => {
    setSlidePortfolio(p);
    setNoteInput(p.adminNote || '');
  };

  const handleApprove = async () => {
    if (!slidePortfolio) return;
    setActionLoading(true);
    try {
      await patchApi(`/admin/portfolios/${slidePortfolio.id}/approve`, { adminNote: noteInput });
      toast.success('포트폴리오가 승인되었습니다.');
      setSlidePortfolio(null);
      fetchData(); fetchStats();
    } catch { toast.error('처리에 실패했습니다.'); }
    finally { setActionLoading(false); }
  };

  const handleReject = async () => {
    if (!slidePortfolio) return;
    if (!noteInput.trim()) { toast.error('반려 사유를 입력해 주세요.'); return; }
    setActionLoading(true);
    try {
      await patchApi(`/admin/portfolios/${slidePortfolio.id}/reject`, { adminNote: noteInput });
      toast.success('포트폴리오가 반려되었습니다.');
      setSlidePortfolio(null);
      fetchData(); fetchStats();
    } catch { toast.error('처리에 실패했습니다.'); }
    finally { setActionLoading(false); }
  };

  const handleHide = async () => {
    if (!slidePortfolio) return;
    const ok = await confirm({ title: '공개 제한', description: `"${slidePortfolio.title}" 포트폴리오를 비공개로 전환하시겠습니까?`, variant: 'danger' });
    if (!ok) return;
    setActionLoading(true);
    try {
      await patchApi(`/admin/portfolios/${slidePortfolio.id}/hide`);
      toast.success('비공개로 전환되었습니다.');
      setSlidePortfolio(null);
      fetchData(); fetchStats();
    } catch { toast.error('처리에 실패했습니다.'); }
    finally { setActionLoading(false); }
  };

  const handleDelete = async (id, title) => {
    const ok = await confirm({ title: '포트폴리오 삭제', description: `"${title}" 포트폴리오를 삭제하시겠습니까?`, variant: 'danger' });
    if (!ok) return;
    try {
      await deleteApi(`/admin/portfolios/${id}`);
      toast.success('포트폴리오가 삭제되었습니다.');
      setSlidePortfolio(null);
      fetchData(); fetchStats();
    } catch { toast.error('삭제에 실패했습니다.'); }
  };

  const isFiltered = search || status || visibility;
  const totalAll = (stats.DRAFT || 0) + (stats.PENDING || 0) + (stats.APPROVED || 0) + (stats.REJECTED || 0);

  return (
    <div className="list-page">
      <div className="page-header">
        <h1 className="page-title">포트폴리오 관리</h1>
        <span className="total-count">
          {isFiltered
            ? `검색 결과 — ${data.totalElements?.toLocaleString()}개`
            : `총 ${data.totalElements?.toLocaleString()}개`}
        </span>
      </div>

      {/* Status stat cards */}
      <div className="pf-stats-row">
        <StatCard label="전체" value={totalAll} active={!status} onClick={() => updateParams({ status: '', page: '' })} />
        <StatCard label="임시저장" value={stats.DRAFT} active={status === 'DRAFT'} onClick={() => updateParams({ status: 'DRAFT', page: '' })} />
        <StatCard label="심사 중" value={stats.PENDING} active={status === 'PENDING'} onClick={() => updateParams({ status: 'PENDING', page: '' })} />
        <StatCard label="승인" value={stats.APPROVED} active={status === 'APPROVED'} onClick={() => updateParams({ status: 'APPROVED', page: '' })} />
        <StatCard label="반려" value={stats.REJECTED} active={status === 'REJECTED'} onClick={() => updateParams({ status: 'REJECTED', page: '' })} />
      </div>

      <div className="filter-bar">
        <input
          className="search-input"
          placeholder="제목·작가·@아이디 검색"
          value={inputValue}
          onChange={e => {
            const val = e.target.value;
            setInputValue(val);
            clearTimeout(searchTimerRef.current);
            searchTimerRef.current = setTimeout(() => updateParams({ search: val, page: '' }), 300);
          }}
        />
        <select className="filter-select" value={visibility} onChange={e => updateParams({ visibility: e.target.value, page: '' })}>
          <option value="">전체 공개</option>
          <option value="PUBLIC">공개</option>
          <option value="PRIVATE">비공개</option>
          <option value="UNLISTED">일부공개</option>
        </select>
        <select className="filter-select" value={sortBy} onChange={e => updateParams({ sortBy: e.target.value, page: '' })}>
          <option value="latest">최신순</option>
          <option value="likes">좋아요순</option>
          <option value="views">조회순</option>
        </select>
        {isFiltered && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setInputValue(''); setSearchParams({}); }}>초기화</button>
        )}
      </div>

      {loading ? (
        <div className="loading-msg">로딩 중...</div>
      ) : data.content.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📁</div>
          <div className="empty-title">{search ? `"${search}"에 대한 결과가 없습니다` : '포트폴리오가 없습니다'}</div>
          <div className="empty-desc">검색어를 다시 확인하거나 필터를 변경해 보세요.</div>
        </div>
      ) : (
        <div className="pf-grid">
          {data.content.map(p => (
            <div key={p.id} className="pf-card" onClick={() => openSlide(p)}>
              <div className="pf-cover-wrap">
                <ImgWithFallback src={p.coverImageUrl} alt={p.title} className="pf-cover" />
                <span className={`badge ${STATUS_BADGE[p.status] || ''} pf-status-badge`}>
                  {STATUS_LABELS[p.status] || p.status}
                </span>
                {p.pinned && <span className="pf-pin-badge">📌</span>}
              </div>
              <div className="pf-body">
                <div className="pf-title">{p.title}</div>
                {p.subtitle && <div className="pf-subtitle">{p.subtitle}</div>}
                <div className="pf-author">{p.authorName} @{p.authorProfile}</div>
                <div className="pf-meta">
                  <span className={`badge ${VISIBILITY_BADGE[p.visibility] || ''}`}>{VISIBILITY_LABELS[p.visibility] || p.visibility}</span>
                  <span className="pf-counts">📷 {p.photoCount} · 📚 {p.seriesCount}</span>
                </div>
                <div className="pf-stats">❤️ {p.likesCount} · 👁 {p.viewCount}</div>
                <div className="pf-date">{p.createdAt?.slice(0, 10)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={data.totalPages}
        onPageChange={p => updateParams({ page: p === 0 ? '' : p })}
      />

      <SlideOver
        open={!!slidePortfolio}
        onClose={() => setSlidePortfolio(null)}
        title="포트폴리오 상세 / 심사"
        width={520}
        footer={
          slidePortfolio && (
            <>
              <button className="btn btn-ghost btn-md" onClick={() => setSlidePortfolio(null)}>닫기</button>
              {slidePortfolio.status === 'PENDING' && (
                <>
                  <button className="btn btn-danger-full btn-md" onClick={handleReject} disabled={actionLoading}>반려</button>
                  <button className="btn btn-success btn-md" onClick={handleApprove} disabled={actionLoading}>승인</button>
                </>
              )}
              {slidePortfolio.status === 'APPROVED' && (
                <button className="btn btn-warning btn-md" onClick={handleHide} disabled={actionLoading}>비공개 전환</button>
              )}
              <button
                className="btn btn-danger-full btn-md"
                onClick={() => handleDelete(slidePortfolio.id, slidePortfolio.title)}
                disabled={actionLoading}
              >삭제</button>
            </>
          )
        }
      >
        {slidePortfolio && (
          <>
            <ImgWithFallback
              src={slidePortfolio.coverImageUrl}
              alt={slidePortfolio.title}
              className="so-detail-img"
            />
            <div className="so-field">
              <span className="so-label">제목</span>
              <span className="so-value">{slidePortfolio.title}</span>
            </div>
            {slidePortfolio.subtitle && (
              <div className="so-field">
                <span className="so-label">부제목</span>
                <span className="so-value">{slidePortfolio.subtitle}</span>
              </div>
            )}
            <div className="so-field">
              <span className="so-label">작가</span>
              <span className="so-value">{slidePortfolio.authorName} (@{slidePortfolio.authorProfile})</span>
            </div>
            <div className="so-field">
              <span className="so-label">상태 / 공개</span>
              <span className="so-value" style={{ display: 'flex', gap: 8 }}>
                <span className={`badge ${STATUS_BADGE[slidePortfolio.status] || ''}`}>{STATUS_LABELS[slidePortfolio.status]}</span>
                <span className={`badge ${VISIBILITY_BADGE[slidePortfolio.visibility] || ''}`}>{VISIBILITY_LABELS[slidePortfolio.visibility]}</span>
              </span>
            </div>
            <div className="so-field">
              <span className="so-label">구성</span>
              <span className="so-value">사진 {slidePortfolio.photoCount}장 · 시리즈 {slidePortfolio.seriesCount}개</span>
            </div>
            <div className="so-field">
              <span className="so-label">통계</span>
              <span className="so-value">❤️ {slidePortfolio.likesCount} · 👁 {slidePortfolio.viewCount}</span>
            </div>
            {slidePortfolio.tags && (
              <div className="so-field">
                <span className="so-label">태그</span>
                <span className="so-value">{slidePortfolio.tags}</span>
              </div>
            )}
            {slidePortfolio.categoryCode && slidePortfolio.categoryCode !== '0000000000' && (
              <div className="so-field">
                <span className="so-label">카테고리 코드</span>
                <span className="so-value code-badge">{slidePortfolio.categoryCode}</span>
              </div>
            )}
            <div className="so-field">
              <span className="so-label">등록일</span>
              <span className="so-value">{slidePortfolio.createdAt?.slice(0, 10)}</span>
            </div>
            {slidePortfolio.reviewedAt && (
              <div className="so-field">
                <span className="so-label">심사일</span>
                <span className="so-value">{slidePortfolio.reviewedAt?.slice(0, 10)}</span>
              </div>
            )}
            <hr className="so-divider" />
            <div className="so-field">
              <span className="so-label">아이템 순서</span>
              <button
                className="btn btn-ghost btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                onClick={() => navigate(`/sort/portfolios/${slidePortfolio.id}`)}
              >
                <ListOrdered size={13} /> 아이템 정렬
              </button>
            </div>
            <div className="so-field">
              <span className="so-label">관리자 메모 {slidePortfolio.status === 'PENDING' && <span style={{ color: 'var(--color-danger)', fontWeight: 400 }}>(반려 시 필수)</span>}</span>
              <textarea
                className="so-textarea"
                rows={3}
                value={noteInput}
                onChange={e => setNoteInput(e.target.value)}
                placeholder="관리자 메모 또는 반려 사유를 입력하세요."
              />
            </div>
          </>
        )}
      </SlideOver>
    </div>
  );
};

export default PortfolioListPage;

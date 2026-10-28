import React, { useEffect, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { Sparkles, Images } from 'lucide-react';
import { getApi, putApi } from '../utils/api';
import { useConfirm } from '../context/ConfirmContext';
import Pagination from '../components/common/Pagination';
import ImgWithFallback from '../components/common/ImgWithFallback';
import SegmentedControl from '../components/common/SegmentedControl';
import './CurationPage.css';

const formatDate = (v) => (v ? v.slice(0, 10) : '-');

const CurationCard = ({ item, onToggle, busy }) => {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add('visible'); obs.disconnect(); }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <article ref={ref} className={`curation-card${item.featured ? ' curation-card--featured' : ''}`}>
      <div className="curation-cover">
        <ImgWithFallback src={item.coverImageUrl} alt={item.title} className="curation-cover-img" />
        {item.featured && <span className="curation-flag"><Sparkles size={12} /> 에디터 추천</span>}
      </div>
      <div className="curation-body">
        <div className="curation-title">{item.title}</div>
        <div className="curation-meta">
          {item.authorName}
          {item.shootType && <> · {item.shootType}</>}
        </div>
        <div className="curation-stats">
          <span><Images size={12} /> {item.photoCount}장</span>
          <span>{item.featured ? `추천 ${formatDate(item.featuredAt)}` : `등록 ${formatDate(item.createdAt)}`}</span>
        </div>
        <button
          type="button"
          className={`btn btn-sm ${item.featured ? 'btn-danger-outline' : 'btn-primary'} curation-action`}
          onClick={() => onToggle(item)}
          disabled={busy}
        >
          {item.featured ? '추천 내리기' : '추천 올리기'}
        </button>
      </div>
    </article>
  );
};

const CurationPage = () => {
  const { confirm } = useConfirm();
  const [tab, setTab] = useState('featured');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [counts, setCounts] = useState({ featured: null, candidates: null });
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ featured: tab === 'featured', page, size: 24 });
    if (query) params.set('search', query);
    Promise.all([
      getApi(`/admin/series/curation?${params}`),
      getApi('/admin/series/curation?featured=true&size=1'),
      getApi('/admin/series/curation?featured=false&size=1'),
    ]).then(([d, f, c]) => {
      setData(d);
      setCounts({ featured: f.totalElements, candidates: c.totalElements });
    }).catch(() => toast.error('작업 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [tab, page, query]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const t = setTimeout(() => { setQuery(search.trim()); setPage(0); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleToggle = async (item) => {
    const next = !item.featured;
    const ok = await confirm({
      title: next ? '에디터 추천 올리기' : '에디터 추천 내리기',
      description: next
        ? `"${item.title}" 작업을 App 탐색 상단 "에디터 추천"에 노출합니다.`
        : `"${item.title}" 작업을 에디터 추천에서 내립니다.`,
      variant: next ? 'warning' : 'danger',
    });
    if (!ok) return;
    setBusyId(item.id);
    try {
      await putApi(`/admin/series/${item.id}/featured`, { featured: next });
      toast.success(next ? '에디터 추천에 올렸습니다.' : '에디터 추천에서 내렸습니다.');
      fetchData();
    } catch (e) {
      toast.error(e.message || '처리에 실패했습니다.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="list-page curation-page">
      <div className="page-header">
        <h1 className="page-title">작업 큐레이션</h1>
        <span className="total-count">App 탐색 "에디터 추천" 노출 관리</span>
      </div>

      <div className="curation-toolbar">
        <SegmentedControl
          ariaLabel="큐레이션 구분"
          value={tab}
          onChange={(v) => { setTab(v); setPage(0); }}
          options={[
            { value: 'featured', label: '추천 중', count: counts.featured },
            { value: 'candidates', label: '후보', count: counts.candidates },
          ]}
        />
        <input
          className="search-input"
          placeholder="작업 제목·작가 검색"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <p className="curation-hint">초안 작업과 사진이 없는 작업은 후보에서 제외됩니다. 추천은 최근에 올린 순서로 노출됩니다.</p>

      {loading && data.content.length === 0 ? (
        <div className="curation-grid">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="curation-skeleton skeleton" />)}
        </div>
      ) : data.content.length === 0 ? (
        <div className="empty-state">
          {tab === 'featured' ? '현재 에디터 추천 중인 작업이 없습니다. 후보 탭에서 올려보세요.' : '추천할 수 있는 작업이 없습니다.'}
        </div>
      ) : (
        <div className="curation-grid">
          {data.content.map(item => (
            <CurationCard key={item.id} item={item} onToggle={handleToggle} busy={busyId === item.id} />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
    </div>
  );
};

export default CurationPage;

import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { MapPin, CalendarDays, Users, Heart, MessageCircle } from 'lucide-react';
import { getApi, deleteApi } from '../utils/api';
import { useConfirm } from '../context/ConfirmContext';
import Pagination from '../components/common/Pagination';
import SlideOver from '../components/common/SlideOver';
import ImgWithFallback from '../components/common/ImgWithFallback';
import SegmentedControl from '../components/common/SegmentedControl';
import './GatheringListPage.css';

const STATUS_LABELS = {
  RECRUITING: '모집 중', RECRUITMENT_CLOSED: '모집 마감', SCHEDULED: '예정', ONGOING: '진행 중', ENDED: '종료',
};
const STATUS_CLASSES = {
  RECRUITING: 'badge-green', RECRUITMENT_CLOSED: 'badge-yellow', SCHEDULED: 'badge-blue', ONGOING: 'badge-purple', ENDED: 'badge-draft',
};

const formatDateTime = (v) => (v ? v.slice(0, 16).replace('T', ' ') : '-');

const GatheringListPage = () => {
  const { confirm } = useConfirm();
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, size: 20 });
    if (status) params.set('status', status);
    if (query) params.set('search', query);
    Promise.all([
      getApi(`/admin/gatherings?${params}`),
      getApi('/admin/gatherings/counts'),
    ]).then(([d, c]) => { setData(d); setCounts(c); })
      .catch(() => toast.error('모임 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [page, status, query]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const t = setTimeout(() => { setQuery(search.trim()); setPage(0); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadPosts = useCallback((gatheringId) => {
    setPostsLoading(true);
    getApi(`/admin/gatherings/${gatheringId}/posts`)
      .then(setPosts)
      .catch(() => toast.error('게시글을 불러오지 못했습니다.'))
      .finally(() => setPostsLoading(false));
  }, []);

  const openDetail = (g) => {
    setSelected(g);
    setPosts([]);
    loadPosts(g.id);
  };

  const handleDeletePost = async (post) => {
    const ok = await confirm({
      title: '게시글 삭제',
      description: `${post.memberName}님의 게시글을 삭제합니다. 첨부 사진·좋아요·댓글도 함께 지워지며 되돌릴 수 없습니다.`,
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteApi(`/admin/gatherings/posts/${post.id}`);
      toast.success('게시글을 삭제했습니다.');
      loadPosts(selected.id);
      setSelected(s => s && { ...s, postCount: Math.max(0, s.postCount - 1) });
      fetchData();
    } catch (e) {
      toast.error(e.message || '삭제에 실패했습니다.');
    }
  };

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const statusOptions = [
    { value: '', label: '전체', count: total },
    ...Object.keys(STATUS_LABELS).map(k => ({ value: k, label: STATUS_LABELS[k], count: counts[k] ?? 0 })),
  ];

  return (
    <div className="list-page">
      <div className="page-header">
        <h1 className="page-title">모임 관리</h1>
        <span className="total-count">App 출사 모임 · 모임 피드</span>
      </div>

      <div className="gathering-toolbar">
        <SegmentedControl
          ariaLabel="모임 상태"
          value={status}
          onChange={(v) => { setStatus(v); setPage(0); }}
          options={statusOptions}
        />
        <input
          className="search-input"
          placeholder="모임명·장소 검색"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr><th>모임</th><th>호스트</th><th>일시</th><th>참여</th><th>피드</th><th>상태</th></tr>
          </thead>
          <tbody>
            {loading && data.content.length === 0 ? (
              <tr><td colSpan="6" className="loading-cell">로딩 중...</td></tr>
            ) : data.content.length === 0 ? (
              <tr><td colSpan="6" className="loading-cell">모임이 없습니다.</td></tr>
            ) : data.content.map(g => (
              <tr key={g.id} className="gathering-row" onClick={() => openDetail(g)}>
                <td>
                  <div className="gathering-cell">
                    <ImgWithFallback src={g.thumbnailUrl} alt={g.title} className="gathering-thumb" />
                    <div className="gathering-cell-text">
                      <div className="name-cell">{g.title}</div>
                      <div className="gathering-sub">{g.location}</div>
                    </div>
                  </div>
                </td>
                <td>{g.hostName || `회원 #${g.createdBy}`}</td>
                <td>{formatDateTime(g.startDateTime)}</td>
                <td>{g.participantCount} / {g.maxParticipants}</td>
                <td>{g.postCount}</td>
                <td><span className={`badge ${STATUS_CLASSES[g.status] || 'badge-draft'}`}>{STATUS_LABELS[g.status] || g.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />

      <SlideOver open={!!selected} onClose={() => setSelected(null)} title={selected?.title || ''} width={520}>
        {selected && (
          <div className="gathering-detail">
            <ImgWithFallback src={selected.thumbnailUrl} alt={selected.title} className="gathering-detail-cover" />
            <div className="gathering-detail-badges">
              <span className={`badge ${STATUS_CLASSES[selected.status] || 'badge-draft'}`}>{STATUS_LABELS[selected.status] || selected.status}</span>
              {selected.shootTheme && <span className="badge badge-purple">{selected.shootTheme}</span>}
            </div>
            <ul className="gathering-facts">
              <li><MapPin size={14} />{selected.location}</li>
              <li><CalendarDays size={14} />{formatDateTime(selected.startDateTime)} ~ {formatDateTime(selected.endDateTime).slice(11)}</li>
              <li><Users size={14} />참여 확정 {selected.participantCount}명 / 정원 {selected.maxParticipants}명 · 호스트 {selected.hostName || `#${selected.createdBy}`}</li>
            </ul>
            {selected.description && <p className="gathering-desc">{selected.description}</p>}

            <h3 className="gathering-section-title">모임 피드 <span>{selected.postCount}</span></h3>
            {postsLoading ? (
              <div className="gathering-post skeleton gathering-post-skeleton" />
            ) : posts.length === 0 ? (
              <div className="empty-state">아직 올라온 게시글이 없습니다.</div>
            ) : (
              <div className="gathering-posts">
                {posts.map(p => (
                  <div key={p.id} className="gathering-post">
                    <div className="gathering-post-head">
                      <span className="name-cell">{p.memberName}</span>
                      <span className="gathering-sub">{formatDateTime(p.createdAt)}</span>
                    </div>
                    {p.content && <p className="gathering-post-body">{p.content}</p>}
                    {p.hashtags && <div className="gathering-post-tags">{p.hashtags}</div>}
                    {p.photoUrls.length > 0 && (
                      <div className="gathering-post-photos">
                        {p.photoUrls.map(u => <ImgWithFallback key={u} src={u} alt="" className="gathering-post-photo" />)}
                      </div>
                    )}
                    <div className="gathering-post-foot">
                      <span><Heart size={12} />{p.likeCount}</span>
                      <span><MessageCircle size={12} />{p.commentCount}</span>
                      <button className="btn-sm btn-danger-outline" onClick={() => handleDeletePost(p)}>삭제</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </SlideOver>
    </div>
  );
};

export default GatheringListPage;

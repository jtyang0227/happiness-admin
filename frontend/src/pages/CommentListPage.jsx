import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { CornerDownRight } from 'lucide-react';
import { getApi, deleteApi } from '../utils/api';
import { useConfirm } from '../context/ConfirmContext';
import Pagination from '../components/common/Pagination';
import ImgWithFallback from '../components/common/ImgWithFallback';
import './CommentListPage.css';

const formatDateTime = (v) => (v ? v.slice(0, 16).replace('T', ' ') : '-');

const CommentListPage = () => {
  const { confirm } = useConfirm();
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [counts, setCounts] = useState({});
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, size: 20 });
    if (query) params.set('search', query);
    Promise.all([
      getApi(`/admin/comments?${params}`),
      getApi('/admin/comments/counts'),
    ]).then(([d, c]) => { setData(d); setCounts(c); })
      .catch(() => toast.error('댓글을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [page, query]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const t = setTimeout(() => { setQuery(search.trim()); setPage(0); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleDelete = async (c) => {
    const ok = await confirm({
      title: '댓글 삭제',
      description: c.replyCount > 0
        ? `${c.memberName}님의 댓글과 답글 ${c.replyCount}개를 함께 삭제합니다. 되돌릴 수 없습니다.`
        : `${c.memberName}님의 댓글을 삭제합니다. 되돌릴 수 없습니다.`,
      variant: 'danger',
    });
    if (!ok) return;
    try {
      const res = await deleteApi(`/admin/comments/${c.id}`);
      toast.success(res.deleted > 1 ? `댓글 ${res.deleted}개를 삭제했습니다.` : '댓글을 삭제했습니다.');
      fetchData();
    } catch (e) {
      toast.error(e.message || '삭제에 실패했습니다.');
    }
  };

  return (
    <div className="list-page">
      <div className="page-header">
        <h1 className="page-title">댓글 관리</h1>
        <span className="total-count">App 사진 댓글·답글</span>
      </div>

      <div className="comment-kpis">
        <div className="comment-kpi">
          <div className="comment-kpi-value">{counts.total?.toLocaleString() ?? '-'}</div>
          <div className="comment-kpi-label">전체 댓글</div>
        </div>
        <div className="comment-kpi">
          <div className="comment-kpi-value">{counts.today?.toLocaleString() ?? '-'}</div>
          <div className="comment-kpi-label">오늘 작성</div>
        </div>
      </div>

      <div className="filter-bar">
        <input
          className="search-input"
          placeholder="댓글 내용·작성자 검색"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {query && <span className="total-count">검색 결과 {data.totalElements.toLocaleString()}건</span>}
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr><th>작성자</th><th>내용</th><th>사진</th><th>구분</th><th>작성일</th><th>관리</th></tr>
          </thead>
          <tbody>
            {loading && data.content.length === 0 ? (
              <tr><td colSpan="6" className="loading-cell">로딩 중...</td></tr>
            ) : data.content.length === 0 ? (
              <tr><td colSpan="6" className="loading-cell">{query ? '검색 결과가 없습니다.' : '댓글이 없습니다.'}</td></tr>
            ) : data.content.map(c => (
              <tr key={c.id}>
                <td className="name-cell">{c.memberName}</td>
                <td className="comment-content-cell">
                  {c.parentId && <CornerDownRight size={12} className="comment-reply-icon" />}
                  <span title={c.content}>{c.content}</span>
                </td>
                <td>
                  <div className="comment-photo">
                    <ImgWithFallback src={c.photoThumbnailUrl} alt={c.photoTitle || ''} className="comment-photo-thumb" />
                    <span className="comment-photo-title">{c.photoTitle || `사진 #${c.photoId}`}</span>
                  </div>
                </td>
                <td>
                  {c.parentId
                    ? <span className="badge badge-draft">답글</span>
                    : <span className="badge badge-blue">댓글{c.replyCount > 0 ? ` · 답글 ${c.replyCount}` : ''}</span>}
                </td>
                <td>{formatDateTime(c.createdAt)}</td>
                <td>
                  <button className="btn-sm btn-danger-outline" onClick={() => handleDelete(c)}>삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
    </div>
  );
};

export default CommentListPage;

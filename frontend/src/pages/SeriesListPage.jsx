import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ListOrdered } from 'lucide-react';
import { getApi, deleteApi } from '../utils/api';
import { useConfirm } from '../context/ConfirmContext';
import Pagination from '../components/common/Pagination';
import ImgWithFallback from '../components/common/ImgWithFallback';
import './SeriesListPage.css';

const SeriesListPage = () => {
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const searchTimerRef = useRef(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, size: 20 });
    if (search) params.set('search', search);
    getApi(`/admin/series?${params}`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id, title) => {
    const ok = await confirm({
      title: '시리즈 삭제',
      description: `"${title}" 시리즈를 삭제하시겠습니까?`,
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteApi(`/admin/series/${id}`);
      toast.success('시리즈가 삭제되었습니다.');
      fetchData();
    } catch {
      toast.error('삭제에 실패했습니다.');
    }
  };

  return (
    <div className="list-page">
      <div className="page-header">
        <h1 className="page-title">시리즈 관리</h1>
        <span className="total-count">총 {data.totalElements?.toLocaleString()}개</span>
      </div>
      <div className="filter-bar">
        <input
          className="search-input"
          placeholder="시리즈 제목 또는 작가 검색"
          onChange={e => {
            const val = e.target.value;
            clearTimeout(searchTimerRef.current);
            searchTimerRef.current = setTimeout(() => { setSearch(val); setPage(0); }, 300);
          }}
        />
      </div>
      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr><th>커버</th><th>제목</th><th>작가</th><th>사진 수</th><th>생성일</th><th>정렬</th><th>관리</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="loading-cell">로딩 중...</td></tr>
            ) : data.content.map(s => (
              <tr key={s.id}>
                <td>
                  <ImgWithFallback src={s.coverImageUrl} alt={s.title} className="series-cover" />
                </td>
                <td className="series-title">{s.title}</td>
                <td>{s.authorName}</td>
                <td>{s.photoCount}장</td>
                <td>{s.createdAt?.slice(0, 10)}</td>
                <td>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    onClick={() => navigate(`/sort/series/${s.id}`)}
                    title="사진 순서 정렬"
                  >
                    <ListOrdered size={13} /> 사진 정렬
                  </button>
                </td>
                <td>
                  <button className="btn-danger-sm" onClick={() => handleDelete(s.id, s.title)}>삭제</button>
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

export default SeriesListPage;

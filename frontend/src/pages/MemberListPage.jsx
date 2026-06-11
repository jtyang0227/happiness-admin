import React, { useEffect, useState, useCallback } from 'react';
import { getApi, patchApi, deleteApi } from '../utils/api';
import Pagination from '../components/common/Pagination';
import './MemberListPage.css';


const AUTHORITY_COLORS = { WM: 'badge-purple', SA: 'badge-blue', US: 'badge-green' };

const MemberListPage = () => {
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [search, setSearch] = useState('');
  const [authority, setAuthority] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, size: 20 });
    if (search) params.set('search', search);
    if (authority) params.set('authority', authority);
    getApi(`/admin/members?${params}`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [page, search, authority]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRoleChange = async (id, newAuthority) => {
    await patchApi(`/admin/members/${id}/role`, { authority: newAuthority });
    fetchData();
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`"${name}" 회원을 삭제하시겠습니까?\n사진, 시리즈, 문의가 함께 삭제됩니다.`)) return;
    await deleteApi(`/admin/members/${id}`);
    fetchData();
  };

  return (
    <div className="list-page">
      <div className="page-header">
        <h1 className="page-title">회원 관리</h1>
        <span className="total-count">총 {data.totalElements?.toLocaleString()}명</span>
      </div>

      <div className="filter-bar">
        <input className="search-input" placeholder="이름 또는 이메일 검색" value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }} />
        <select className="filter-select" value={authority} onChange={e => { setAuthority(e.target.value); setPage(0); }}>
          <option value="">전체 역할</option>
          <option value="WM">웹관리자</option>
          <option value="SA">운영자</option>
          <option value="US">일반</option>
        </select>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr><th>이름</th><th>이메일</th><th>프로필</th><th>역할</th><th>사진 수</th><th>가입일</th><th>관리</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="loading-cell">로딩 중...</td></tr>
            ) : data.content.map(m => (
              <tr key={m.id}>
                <td className="name-cell">{m.name}</td>
                <td>{m.email}</td>
                <td>{m.profileName || '-'}</td>
                <td>
                  <select
                    className={`role-select badge ${AUTHORITY_COLORS[m.authority]}`}
                    value={m.authority}
                    onChange={e => handleRoleChange(m.id, e.target.value)}
                  >
                    <option value="WM">웹관리자</option>
                    <option value="SA">운영자</option>
                    <option value="US">일반</option>
                  </select>
                </td>
                <td>{m.photoCount}</td>
                <td>{m.createdAt?.slice(0, 10)}</td>
                <td>
                  <button className="btn-danger-sm" onClick={() => handleDelete(m.id, m.name)}>삭제</button>
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

export default MemberListPage;

import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getApi, patchApi, deleteApi } from '../utils/api';
import { useConfirm } from '../context/ConfirmContext';
import Pagination from '../components/common/Pagination';
import './MemberListPage.css';

const AUTHORITY_COLORS = { WM: 'badge-purple', SA: 'badge-blue', US: 'badge-green' };

const MemberListPage = () => {
  const { confirm } = useConfirm();
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

  const handleRoleChange = async (id, name, newAuthority) => {
    const LABELS = { WM: '웹관리자', SA: '운영자', US: '일반 회원' };
    const ok = await confirm({
      title: '역할 변경',
      description: `"${name}"의 역할을 ${LABELS[newAuthority]}(${newAuthority})로 변경하시겠습니까?`,
      variant: 'warning',
    });
    if (!ok) { fetchData(); return; }
    try {
      await patchApi(`/admin/members/${id}/role`, { authority: newAuthority });
      toast.success('역할이 변경되었습니다.');
      fetchData();
    } catch {
      toast.error('역할 변경에 실패했습니다.');
      fetchData();
    }
  };

  const handleDelete = async (id, name) => {
    const ok = await confirm({
      title: '회원 삭제',
      description: `"${name}" 회원을 삭제합니다.\n사진, 시리즈, 문의가 함께 삭제됩니다.`,
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteApi(`/admin/members/${id}`);
      toast.success('회원이 삭제되었습니다.');
      fetchData();
    } catch {
      toast.error('삭제에 실패했습니다.');
    }
  };

  return (
    <div className="list-page">
      <div className="page-header">
        <h1 className="page-title">회원 관리</h1>
        <span className="total-count">총 {data.totalElements?.toLocaleString()}명</span>
      </div>

      <div className="filter-bar">
        <input
          className="search-input"
          placeholder="이름 또는 이메일 검색"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
        />
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
                    onChange={e => handleRoleChange(m.id, m.name, e.target.value)}
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

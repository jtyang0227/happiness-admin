import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { getApi, patchApi, deleteApi } from '../utils/api';
import { useConfirm } from '../context/ConfirmContext';
import Pagination from '../components/common/Pagination';
import './InquiryListPage.css';

const SHOOT_TYPES = ['웨딩', '가족', '프로필', '스냅', '바디프로필', '커플'];

const InquiryListPage = () => {
  const { confirm } = useConfirm();
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [isRead, setIsRead] = useState('');
  const [shootType, setShootType] = useState('');
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, size: 20 });
    if (isRead !== '') params.set('isRead', isRead);
    if (shootType) params.set('shootType', shootType);
    getApi(`/admin/inquiries?${params}`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [page, isRead, shootType]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRead = async (id) => {
    try {
      await patchApi(`/admin/inquiries/${id}/read`, {});
      toast.success('읽음 처리되었습니다.');
      fetchData();
    } catch {
      toast.error('처리에 실패했습니다.');
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: '문의 삭제',
      description: '이 문의를 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteApi(`/admin/inquiries/${id}`);
      toast.success('문의가 삭제되었습니다.');
      fetchData();
    } catch {
      toast.error('삭제에 실패했습니다.');
    }
  };

  const unreadCount = data.content.filter(i => !(i.read || i.isRead)).length;

  const handleReadAll = async () => {
    if (unreadCount === 0) return;
    const ok = await confirm({
      title: '모두 읽음 처리',
      description: `현재 페이지의 미읽음 문의 ${unreadCount}건을 모두 읽음으로 처리합니다.`,
      variant: 'warning',
    });
    if (!ok) return;
    try {
      const unread = data.content.filter(i => !(i.read || i.isRead));
      await Promise.all(unread.map(i => patchApi(`/admin/inquiries/${i.id}/read`, {})));
      toast.success('모든 문의를 읽음 처리했습니다.');
      fetchData();
    } catch {
      toast.error('일부 처리에 실패했습니다.');
    }
  };

  return (
    <div className="list-page">
      <div className="page-header">
        <h1 className="page-title">문의 관리</h1>
        <span className="total-count">총 {data.totalElements?.toLocaleString()}건</span>
        {unreadCount > 0 && (
          <button className="btn-read-all" onClick={handleReadAll}>
            모두 읽음 처리 ({unreadCount})
          </button>
        )}
      </div>
      <div className="filter-bar">
        <select className="filter-select" value={isRead} onChange={e => { setIsRead(e.target.value); setPage(0); }}>
          <option value="">전체</option>
          <option value="false">미읽음</option>
          <option value="true">읽음</option>
        </select>
        <select className="filter-select" value={shootType} onChange={e => { setShootType(e.target.value); setPage(0); }}>
          <option value="">전체 촬영 종류</option>
          {SHOOT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 24 }}></th>
              <th>보낸 사람</th><th>받는 작가</th><th>촬영 종류</th>
              <th>희망 날짜</th><th>예산</th><th>접수일</th><th>상태</th><th>관리</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" className="loading-cell">로딩 중...</td></tr>
            ) : data.content.map(i => {
              const readStatus = i.read || i.isRead;
              const isExpanded = expanded === i.id;
              return (
                <React.Fragment key={i.id}>
                  <tr
                    className={`inquiry-row ${!readStatus ? 'unread-row' : ''}`}
                    onClick={() => setExpanded(isExpanded ? null : i.id)}
                  >
                    <td className="chevron-cell">
                      {isExpanded
                        ? <ChevronDown size={14} color="var(--color-text-tertiary)" />
                        : <ChevronRight size={14} color="var(--color-text-tertiary)" />}
                    </td>
                    <td><div className="sender-name">{i.senderName}</div><small>{i.senderEmail}</small></td>
                    <td>{i.receiverProfileName || '-'}</td>
                    <td>{i.shootType || '-'}</td>
                    <td>{i.shootDate || '-'}</td>
                    <td>{i.budget || '-'}</td>
                    <td>{i.createdAt?.slice(0, 10)}</td>
                    <td>
                      <span className={`badge ${readStatus ? 'badge-green' : 'badge-red'}`}>
                        {readStatus ? '읽음' : '미읽음'}
                      </span>
                    </td>
                    <td onClick={e => e.stopPropagation()} className="action-cell">
                      {!readStatus && (
                        <button className="btn-action" onClick={() => handleRead(i.id)}>읽음</button>
                      )}
                      <button className="btn-danger-sm" onClick={() => handleDelete(i.id)}>삭제</button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan="9" className="inquiry-detail">
                        <div className="inquiry-message">{i.message}</div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
    </div>
  );
};

export default InquiryListPage;

import React, { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ExternalLink } from 'lucide-react';
import { getApi, deleteApi } from '../utils/api';
import { useConfirm } from '../context/ConfirmContext';
import Pagination from '../components/common/Pagination';
import ImgWithFallback from '../components/common/ImgWithFallback';
import SegmentedControl from '../components/common/SegmentedControl';
import { safeHref } from '../utils/safeUrl';
import './ProfileContentPage.css';

const TYPES = [
  { value: 'testimonials', label: '후기' },
  { value: 'pricing', label: '가격 패키지' },
  { value: 'press', label: '언론 보도' },
  { value: 'achievements', label: '수상·전시' },
  { value: 'brands', label: '클라이언트 브랜드' },
];
const TYPE_LABEL = Object.fromEntries(TYPES.map(t => [t.value, t.label]));

const ProfileContentPage = () => {
  const { confirm } = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();
  const memberId = searchParams.get('memberId') || '';
  const [type, setType] = useState('testimonials');
  const [page, setPage] = useState(0);
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ type, page, size: 20 });
    if (memberId) params.set('memberId', memberId);
    Promise.all([
      getApi(`/admin/profile-content?${params}`),
      getApi('/admin/profile-content/counts'),
    ]).then(([d, c]) => { setData(d); setCounts(c); })
      .catch(() => toast.error('프로필 콘텐츠를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [type, page, memberId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (item) => {
    const ok = await confirm({
      title: `${TYPE_LABEL[item.type]} 삭제`,
      description: `${item.memberName || `작가 #${item.memberId}`}의 "${item.title}"을(를) 삭제합니다. 작가 프로필에서 즉시 사라지며 되돌릴 수 없습니다.`,
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteApi(`/admin/profile-content/${item.type}/${item.id}`);
      toast.success('삭제했습니다.');
      fetchData();
    } catch (e) {
      toast.error(e.message || '삭제에 실패했습니다.');
    }
  };

  return (
    <div className="list-page">
      <div className="page-header">
        <h1 className="page-title">프로필 콘텐츠 점검</h1>
        <span className="total-count">작가가 공개 프로필에 올린 후기·가격·이력 (허위·부적절 콘텐츠 대응)</span>
      </div>

      <div className="pc-toolbar">
        <SegmentedControl
          ariaLabel="콘텐츠 종류"
          value={type}
          onChange={(v) => { setType(v); setPage(0); }}
          options={TYPES.map(t => ({ ...t, count: counts[t.value] }))}
        />
        {memberId && (
          <span className="pc-member-filter">
            작가 #{memberId}만 보는 중
            <button type="button" aria-label="작가 필터 해제" onClick={() => { setSearchParams({}); setPage(0); }}>×</button>
          </span>
        )}
      </div>

      {loading && data.content.length === 0 ? (
        <div className="pc-list">{[0, 1, 2].map(i => <div key={i} className="pc-item skeleton pc-skeleton" />)}</div>
      ) : data.content.length === 0 ? (
        <div className="empty-state">등록된 {TYPE_LABEL[type]}이(가) 없습니다.</div>
      ) : (
        <div className="pc-list">
          {data.content.map(item => (
            <article key={`${item.type}-${item.id}`} className="pc-item">
              {item.imageUrl && <ImgWithFallback src={item.imageUrl} alt="" className="pc-logo" />}
              <div className="pc-main">
                <div className="pc-head">
                  <span className="pc-title">{item.title}</span>
                  {item.tags.map(t => <span key={t} className="badge badge-purple">{t}</span>)}
                </div>
                {item.subtitle && <div className="pc-sub">{item.subtitle}</div>}
                {item.body && <p className="pc-body">{item.body}</p>}
                <div className="pc-meta">
                  <Link to={`/members/${item.memberId}`} className="pc-author">{item.memberName || `작가 #${item.memberId}`}</Link>
                  <span>· {item.createdAt?.slice(0, 10)}</span>
                  {safeHref(item.linkUrl) && (
                    <a href={safeHref(item.linkUrl)} target="_blank" rel="noopener noreferrer" className="pc-link">
                      링크 <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>
              <button type="button" className="btn-sm btn-danger-outline pc-delete" onClick={() => handleDelete(item)}>삭제</button>
            </article>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
    </div>
  );
};

export default ProfileContentPage;

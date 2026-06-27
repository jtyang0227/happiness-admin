import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getApi, patchApi } from '../utils/api';
import { useConfirm } from '../context/ConfirmContext';
import './ContentPolicyPage.css';

const ContentPolicyPage = () => {
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [maintenanceSaving, setMaintenanceSaving] = useState(false);
  const { confirm } = useConfirm();

  const loadPolicy = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getApi('/admin/content-policy');
      setPolicy(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPolicy(); }, [loadPolicy]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await patchApi('/admin/content-policy', {
        'sort.default': policy['sort.default'],
        'sort.new_author_boost_days': String(policy['sort.new_author_boost_days']),
        'sort.composite_likes_weight': String(policy['sort.composite_likes_weight']),
        'sort.composite_inquiries_weight': String(policy['sort.composite_inquiries_weight']),
        'sort.composite_views_weight': String(policy['sort.composite_views_weight']),
        'maintenance.message': policy['maintenance.message'],
      });
      setPolicy(updated);
      toast.success('정책이 저장되었습니다.');
    } catch {
      toast.error('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleMaintenanceToggle = async () => {
    const isEnabled = policy['maintenance.enabled'] === 'true';
    const ok = await confirm({
      title: isEnabled ? '유지보수 모드 비활성화' : '유지보수 모드 활성화',
      description: isEnabled
        ? '유지보수 모드를 비활성화하면 일반 사용자가 앱에 접근할 수 있습니다.'
        : '유지보수 모드를 활성화하면 일반 사용자가 앱을 사용할 수 없습니다.',
      variant: isEnabled ? 'warning' : 'danger',
    });
    if (!ok) return;
    setMaintenanceSaving(true);
    try {
      await patchApi('/admin/content-policy/maintenance/toggle', { enabled: !isEnabled });
      setPolicy(prev => ({ ...prev, 'maintenance.enabled': String(!isEnabled) }));
      toast.success(isEnabled ? '유지보수 모드가 비활성화되었습니다.' : '유지보수 모드가 활성화되었습니다.');
    } catch {
      toast.error('변경에 실패했습니다.');
    } finally {
      setMaintenanceSaving(false);
    }
  };

  const set = (key, val) => setPolicy(prev => ({ ...prev, [key]: val }));

  const totalWeight = policy
    ? parseFloat(policy['sort.composite_likes_weight'] || 0)
      + parseFloat(policy['sort.composite_inquiries_weight'] || 0)
      + parseFloat(policy['sort.composite_views_weight'] || 0)
    : 0;

  if (loading || !policy) return <div className="page-loading">로딩 중...</div>;

  const isMaintenanceEnabled = policy['maintenance.enabled'] === 'true';

  return (
    <div className="content-policy-page">
      <h1 className="page-title">콘텐츠 정책 설정</h1>

      {/* 유지보수 모드 */}
      <div className="policy-card">
        <div className="policy-card-header">
          <h2 className="policy-card-title">유지보수 모드</h2>
          <span className={`badge ${isMaintenanceEnabled ? 'badge-red' : 'badge-green'}`}>
            {isMaintenanceEnabled ? '활성화됨' : '비활성화'}
          </span>
        </div>
        <p className="policy-desc">활성화하면 일반 사용자 앱 접근이 차단됩니다.</p>
        <div className="policy-row">
          <label className="policy-label">점검 메시지</label>
          <input
            className="policy-input"
            value={policy['maintenance.message'] || ''}
            onChange={e => set('maintenance.message', e.target.value)}
          />
        </div>
        <button
          className={`maintenance-toggle-btn ${isMaintenanceEnabled ? 'active' : ''}`}
          onClick={handleMaintenanceToggle}
          disabled={maintenanceSaving}
        >
          {maintenanceSaving
            ? '처리 중...'
            : isMaintenanceEnabled ? '유지보수 모드 비활성화' : '유지보수 모드 활성화'}
        </button>
      </div>

      {/* 정렬 정책 */}
      <div className="policy-card">
        <h2 className="policy-card-title">기본 정렬 정책</h2>
        <div className="policy-sort-options">
          {[
            { value: 'latest', label: '최신순', desc: '업로드 날짜 기준 최신 사진 우선' },
            { value: 'popular', label: '인기순', desc: '좋아요 수 기준 내림차순' },
            { value: 'composite', label: '복합순', desc: '좋아요 · 문의 · 조회 가중치 합산' },
          ].map(opt => (
            <label key={opt.value} className={`sort-option${policy['sort.default'] === opt.value ? ' selected' : ''}`}>
              <input
                type="radio"
                name="sortDefault"
                value={opt.value}
                checked={policy['sort.default'] === opt.value}
                onChange={() => set('sort.default', opt.value)}
              />
              <span className="sort-option-label">{opt.label}</span>
              <span className="sort-option-desc">{opt.desc}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 신규 작가 부스트 */}
      <div className="policy-card">
        <h2 className="policy-card-title">신규 작가 부스트</h2>
        <p className="policy-desc">가입 후 N일 이내 작가의 사진에 노출 가중치를 부여합니다.</p>
        <div className="policy-row">
          <label className="policy-label">부스트 기간 (일)</label>
          <div className="policy-slider-row">
            <input
              type="range" min="0" max="90" step="1"
              value={policy['sort.new_author_boost_days'] || 30}
              onChange={e => set('sort.new_author_boost_days', e.target.value)}
              className="policy-slider"
            />
            <span className="policy-slider-val">{policy['sort.new_author_boost_days']}일</span>
          </div>
        </div>
      </div>

      {/* 복합 정렬 가중치 */}
      <div className="policy-card">
        <h2 className="policy-card-title">복합 정렬 가중치</h2>
        <p className="policy-desc">세 값의 합계는 1.0이어야 합니다. (현재: <strong style={{ color: Math.abs(totalWeight - 1) > 0.01 ? '#ef4444' : '#22c55e' }}>{totalWeight.toFixed(2)}</strong>)</p>
        {[
          { key: 'sort.composite_likes_weight', label: '좋아요 가중치' },
          { key: 'sort.composite_inquiries_weight', label: '문의 가중치' },
          { key: 'sort.composite_views_weight', label: '조회 가중치' },
        ].map(({ key, label }) => (
          <div key={key} className="policy-row">
            <label className="policy-label">{label}</label>
            <div className="policy-slider-row">
              <input
                type="range" min="0" max="1" step="0.05"
                value={policy[key] || 0}
                onChange={e => set(key, e.target.value)}
                className="policy-slider"
              />
              <span className="policy-slider-val">{parseFloat(policy[key] || 0).toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="policy-footer">
        <button className="btn-secondary" onClick={loadPolicy} disabled={saving}>되돌리기</button>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? '저장 중...' : '설정 저장'}
        </button>
      </div>
    </div>
  );
};

export default ContentPolicyPage;

import React, { useEffect, useState } from 'react';
import { Users, Image, MessageSquare, FolderOpen, ShieldCheck } from 'lucide-react';
import { getApi } from '../../utils/api';
import './ActivityFeed.css';

const ACTIVITY_ICONS = {
  member:       { Icon: Users,        color: '#7C3AED' },
  photo:        { Icon: Image,        color: '#10B981' },
  inquiry:      { Icon: MessageSquare,color: '#F59E0B' },
  portfolio:    { Icon: FolderOpen,   color: '#3B82F6' },
  verification: { Icon: ShieldCheck,  color: '#A78BFA' },
};

const timeAgo = (isoStr) => {
  const diff = Date.now() - new Date(isoStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return '방금 전';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
};

const buildActivities = (inquiries, members) => {
  const acts = [];
  inquiries.slice(0, 5).forEach(i => {
    acts.push({ id: `inq-${i.id}`, type: 'inquiry', text: `${i.senderName}님이 문의를 보냈습니다`, time: i.createdAt });
  });
  members.slice(0, 5).forEach(m => {
    acts.push({ id: `mem-${m.id}`, type: 'member', text: `${m.name}님이 가입했습니다`, time: m.createdAt });
  });
  return acts.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 8);
};

const ActivityFeed = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getApi('/admin/inquiries?page=0&size=5'),
      getApi('/admin/members?page=0&size=5'),
    ]).then(([inqs, mems]) => {
      setItems(buildActivities(inqs.content || [], mems.content || []));
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="activity-feed">
      <div className="activity-feed-header">
        <span className="activity-feed-title">최근 활동</span>
        <span className="activity-feed-badge">{items.length}</span>
      </div>

      {loading ? (
        <div className="activity-feed-skeleton">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="activity-skeleton-item">
              <div className="skeleton activity-skel-icon" />
              <div className="activity-skel-lines">
                <div className="skeleton activity-skel-text" />
                <div className="skeleton activity-skel-time" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="activity-empty">최근 활동이 없습니다</div>
      ) : (
        <ul className="activity-list">
          {items.map(item => {
            const { Icon, color } = ACTIVITY_ICONS[item.type] || ACTIVITY_ICONS.member;
            return (
              <li key={item.id} className="activity-item">
                <span className="activity-icon-wrap" style={{ background: color + '20', color }}>
                  <Icon size={12} />
                </span>
                <div className="activity-content">
                  <span className="activity-text">{item.text}</span>
                  <span className="activity-time">{item.time ? timeAgo(item.time) : '-'}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ActivityFeed;

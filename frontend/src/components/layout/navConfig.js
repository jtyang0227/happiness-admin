import {
  LayoutDashboard, Users, Image, MessageSquare,
  BookOpen, BarChart2, Settings,
  FolderOpen, Bell, Flag, ShieldCheck, LayoutPanelTop,
  Star, SlidersHorizontal, ArrowUpDown, AppWindow,
  CalendarDays, Sparkles, MessagesSquare, Tent, ShieldAlert, IdCard, Mail,
} from 'lucide-react';

export const SORT_ITEMS = [
  { path: '/sort/photos', label: '사진 정렬' },
  { path: '/sort/series', label: '시리즈 정렬' },
];

export const NAV_GROUPS = [
  {
    key: 'dashboard', label: '대시보드', home: '/', Icon: LayoutDashboard,
    items: [],
  },
  {
    key: 'content', label: '콘텐츠', home: '/photos', Icon: Image,
    items: [
      { path: '/photos',         label: '사진 관리',   Icon: Image },
      { path: '/portfolios',     label: '포트폴리오',  Icon: FolderOpen },
      { path: '/series',         label: '시리즈',      Icon: BookOpen },
      { path: '/curation',       label: '작업 큐레이션', Icon: Sparkles },
      { path: '/comments',       label: '댓글 관리',   Icon: MessagesSquare },
      { type: 'sort', label: '정렬 관리', Icon: ArrowUpDown, subItems: SORT_ITEMS },
      { path: '/reports',        label: '신고 관리',   Icon: Flag },
      { path: '/featured',       label: '피처드',      Icon: Star },
      { path: '/content-policy', label: '콘텐츠 정책', Icon: SlidersHorizontal },
    ],
  },
  {
    key: 'member', label: '회원', home: '/members', Icon: Users,
    items: [
      { path: '/members',       label: '회원 관리', Icon: Users },
      { path: '/verifications', label: '작가 인증', Icon: ShieldCheck },
      { path: '/profile-content', label: '프로필 콘텐츠 점검', Icon: IdCard },
    ],
  },
  {
    key: 'ops', label: '운영·마케팅', home: '/inquiries', Icon: MessageSquare,
    items: [
      { path: '/inquiries', label: '문의 관리', Icon: MessageSquare },
      { path: '/bookings',  label: '예약 관리', Icon: CalendarDays },
      { path: '/gatherings', label: '모임 관리', Icon: Tent },
      { path: '/stats',     label: '통계',      Icon: BarChart2 },
      { path: '/notices',   label: '공지사항',  Icon: Bell },
      { path: '/banners',   label: '배너 관리', Icon: LayoutPanelTop },
      { path: '/popups',    label: '팝업 관리', Icon: AppWindow },
      { path: '/newsletter', label: '뉴스레터 구독자', Icon: Mail },
    ],
  },
  {
    key: 'settings', label: '설정', home: '/system', Icon: Settings,
    items: [
      { path: '/system', label: '시스템 설정', Icon: Settings },
      { path: '/security-audit', label: '보안 감사 로그', Icon: ShieldAlert },
    ],
  },
];

const matches = (pathname, path) =>
  path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(`${path}/`);

export const findActiveGroup = (pathname) => {
  if (pathname === '/') return NAV_GROUPS[0];
  return NAV_GROUPS.find(g => g.items.some(item =>
    item.type === 'sort'
      ? pathname.startsWith('/sort')
      : matches(pathname, item.path)
  )) || null;
};

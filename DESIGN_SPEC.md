# Happiness Admin — 디자인 스펙 문서

> 버전: 1.0 | 작성일: 2026-06-19 | 대상: 프론트엔드 개발자, 백엔드 개발자, 기획자

---

## 목차

1. [디자인 원칙 & 비전](#1-디자인-원칙--비전)
2. [디자인 시스템 확장 스펙](#2-디자인-시스템-확장-스펙)
3. [레이아웃 시스템 스펙](#3-레이아웃-시스템-스펙)
4. [공통 컴포넌트 상세 스펙](#4-공통-컴포넌트-상세-스펙)
5. [신규 페이지별 UX/UI 스펙](#5-신규-페이지별-uxui-스펙)
6. [인터랙션 & 마이크로 애니메이션 가이드](#6-인터랙션--마이크로-애니메이션-가이드)
7. [접근성(Accessibility) 스펙](#7-접근성accessibility-스펙)
8. [데이터 시각화 스펙](#8-데이터-시각화-스펙)
9. [다크모드 디자인 스펙](#9-다크모드-디자인-스펙)
10. [구현 우선순위 & 컴포넌트 개발 순서](#10-구현-우선순위--컴포넌트-개발-순서)

---

## 1. 디자인 원칙 & 비전

### 1-1. 디자인 철학

**원칙 1 — Clarity over Cleverness (명확성 우선)**
운영자는 하루 수십~수백 건의 데이터를 처리한다. 창의적인 인터랙션보다 정보를 빠르게 파악할 수 있는 명확한 레이아웃이 우선이다. 텍스트 레이블은 절대 생략하지 않는다. 아이콘 단독 사용 시 반드시 tooltip을 제공한다.

**원칙 2 — Density without Clutter (고밀도, 비혼잡)**
Admin 도구는 정보 밀도가 높아야 한다. 그러나 과도한 패딩 제거나 폰트 축소로 가독성을 해치지 않는다. 행간(line-height 1.5), 셀 패딩(11px 14px)을 지키며 스캔 가능한 밀도를 유지한다.

**원칙 3 — Immediate Feedback (즉각 피드백)**
모든 mutating 액션(삭제, 수정, 상태 변경) 후 반드시 Toast로 성공/실패를 알린다. 로딩 중에는 스피너 또는 스켈레톤으로 진행 상태를 표시한다. 사용자가 "작동했는가?" 를 의심하게 만들지 않는다.

**원칙 4 — Safe Defaults (안전한 기본값)**
파괴적 액션(삭제, 권한 변경, 노출 정책 변경)은 반드시 이중 확인(ConfirmDialog)을 거친다. 기본 버튼 포커스는 항상 "취소"에 있다. 실수로 엔터를 쳐도 데이터가 삭제되지 않는다.

**원칙 5 — Progressive Disclosure (점진적 공개)**
테이블 행의 상세 정보는 SlideOver 패널로 드릴다운한다. 목록에서는 요약 정보만, 패널에서 전체 정보를 보여준다. 화면을 한 번에 과부하시키지 않는다.

### 1-2. 레퍼런스 스타일 포지셔닝

**방향: Linear 스타일 (Functional Dark Sidebar + Clean Content)**

| 항목 | Linear | Notion | Vercel | Happiness Admin |
|---|---|---|---|---|
| 사이드바 | 다크 (#0f172a) | 라이트/다크 | 다크 | **다크 (#0f172a)** |
| 콘텐츠 배경 | 라이트 | 라이트 | 라이트 | **라이트 (#f1f5f9)** |
| Primary 색상 | 보라 | 회색 | 파랑 | **Indigo #6366f1** |
| 타이포그래피 | 소형 sans | 소형 sans | 소형 sans | **Pretendard 14px** |
| 정보 밀도 | 고밀도 | 중간 | 고밀도 | **고밀도** |
| 애니메이션 | 절제 | 절제 | 절제 | **절제** |

Linear를 기준으로 하되 한국어 가독성을 위해 Pretendard 폰트를 우선 적용하고, 콘텐츠 카드 배경은 순수 흰색(#ffffff)이 아닌 서피스 계층(#f1f5f9 → #ffffff)으로 깊이를 준다.

### 1-3. 운영자(WM/SA) 특성 고려 UX 철학

**WM (웹관리자 / Web Manager)**: 시스템 전체 제어 권한. 주요 업무: 회원 권한 관리, 콘텐츠 정책 설정, 공지 관리. 위험 액션이 많으므로 ConfirmDialog는 항상 `variant='warning'` 또는 `variant='danger'`로 분리.

**SA (운영자 / System Admin)**: 일상 운영 담당. 주요 업무: 문의 처리, 신고 검토, 사진/시리즈 콘텐츠 모더레이션. 반복 작업이 많으므로 키보드 단축키(Tab 이동, Enter 확인, Escape 취소)를 우선 지원.

**공통 UX 원칙**:
- 한 화면에서 한 가지 주요 태스크에 집중할 수 있는 구조
- 현재 위치(활성 네비게이션 링크)를 항상 명확히 표시
- 에러 상태에서 재시도 경로를 명확히 제공
- 세션 만료(401) 시 현재 URL 기억 후 로그인 후 복귀

---

## 2. 디자인 시스템 확장 스펙

### 2-1. 컬러 시스템 확장

현재 `tokens.css`에 정의된 토큰을 기반으로 추가 필요 토큰:

```css
:root {
  /* === 기존 토큰 (유지) === */
  --color-brand-50:  #eef2ff;
  --color-brand-100: #e0e7ff;
  --color-brand-400: #818cf8;
  --color-brand-500: #6366f1;
  --color-brand-600: #4f46e5;
  --color-brand-700: #4338ca;

  --color-success:    #22c55e;
  --color-success-bg: #dcfce7;
  --color-warning:    #f59e0b;
  --color-warning-bg: #fffbeb;
  --color-danger:     #ef4444;
  --color-danger-bg:  #fef2f2;
  --color-info:       #06b6d4;
  --color-info-bg:    #ecfeff;

  --color-bg:           #f1f5f9;
  --color-surface:      #ffffff;
  --color-surface-2:    #f8fafc;
  --color-border:       #e2e8f0;
  --color-border-light: #f1f5f9;

  --color-text-primary:   #0f172a;
  --color-text-secondary: #475569;
  --color-text-tertiary:  #94a3b8;
  --color-text-inverse:   #ffffff;

  --color-sidebar-bg:          #0f172a;
  --color-sidebar-hover:       #1e293b;
  --color-sidebar-border:      #1e293b;
  --color-sidebar-text:        #94a3b8;
  --color-sidebar-active-text: #818cf8;

  /* === 추가 필요 토큰 === */

  /* Semantic — 텍스트 변형 */
  --color-success-text: #16a34a;
  --color-warning-text: #d97706;
  --color-danger-text:  #dc2626;
  --color-info-text:    #0891b2;

  /* Semantic — 테두리 변형 */
  --color-success-border: #bbf7d0;
  --color-warning-border: #fde68a;
  --color-danger-border:  #fecaca;
  --color-info-border:    #a5f3fc;

  /* Neutral 확장 */
  --color-text-muted:    #64748b;    /* tertiary보다 한 단계 진한 회색 */
  --color-surface-3:     #f1f5f9;    /* Hover 배경 (테이블 행 hover) */
  --color-overlay:       rgba(0, 0, 0, 0.45);  /* 모달 오버레이 */
  --color-overlay-light: rgba(0, 0, 0, 0.25);  /* SlideOver 오버레이 */

  /* 역할별 색상 (Badge) */
  --color-role-wm-bg:   #f5f3ff;
  --color-role-wm-text: #7c3aed;
  --color-role-sa-bg:   #eff6ff;
  --color-role-sa-text: #2563eb;
  --color-role-us-bg:   #dcfce7;
  --color-role-us-text: #16a34a;

  /* 콘텐츠 상태 색상 */
  --color-featured-bg:   #fef9c3;
  --color-featured-text: #a16207;
  --color-banned-bg:     #fef2f2;
  --color-banned-text:   #dc2626;
  --color-pending-bg:    #f0f9ff;
  --color-pending-text:  #0369a1;

  /* 차트 팔레트 (8색, JS 상수로 별도 관리) */
  /* 주의: Recharts SVG fill/stroke에 var() 직접 사용 불가 */
  /* JS: const CHART_COLORS = ['#6366f1','#22c55e','#f59e0b','#ef4444','#06b6d4','#a855f7','#ec4899','#84cc16']; */

  /* SlideOver / Drawer */
  --slideover-width: 420px;
  --slideover-width-lg: 560px;

  /* Z-index 계층 */
  --z-sidebar:       100;
  --z-overlay:       150;
  --z-slideover:     200;
  --z-modal:         300;
  --z-toast:         400;
  --z-tooltip:       500;
}
```

### 2-2. 타이포그래피 스케일

현재 토큰 기반 적용 가이드:

| 토큰 | 값 | 사용처 | font-weight |
|---|---|---|---|
| `--text-xs` | 11px | Badge 텍스트, 테이블 보조 정보, 타임스탬프 | 600 (Badge), 400 (메타) |
| `--text-sm` | 13px | 테이블 셀 내용, 폼 레이블, Toast 메시지 | 400~600 |
| `--text-base` | 14px | 본문 기본, 필터 select, 사이드바 링크 | 400~600 |
| `--text-md` | 15px | 카드 본문, 폼 입력값 | 400 |
| `--text-lg` | 18px | 카드 제목(`card-title`), 모달 제목 | 700 |
| `--text-xl` | 22px | 페이지 제목(`page-title`) | 700 |
| `--text-2xl` | 28px | 대시보드 KPI 수치 | 700~800 |

**Line-height 기준**:
- 단일 행 UI (버튼, Badge, 테이블 셀): `line-height: 1.2`
- 본문 텍스트: `line-height: 1.5`
- 긴 설명문 (모달 description, 공지 본문): `line-height: 1.7`

**Letter-spacing 기준**:
- 영문 대문자 레이블 (역할명 US/WM/SA): `letter-spacing: 0.05em`
- 일반 텍스트: `letter-spacing: normal`

**적용 예시**:
```css
/* 페이지 제목 */
.page-title {
  font-size: var(--text-xl);   /* 22px */
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.2;
  margin: 0 0 24px;
}

/* 카드 제목 */
.card-title {
  font-size: var(--text-lg);   /* 18px */
  font-weight: 700;
  color: var(--color-text-primary);
}

/* 테이블 헤더 */
.data-table th {
  font-size: var(--text-sm);   /* 13px */
  font-weight: 600;
  color: var(--color-text-secondary);
}

/* KPI 수치 */
.kpi-value {
  font-size: var(--text-2xl);  /* 28px */
  font-weight: 700;
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;  /* 수치 정렬 */
}
```

### 2-3. 스페이싱 & 레이아웃 그리드

**8px 그리드 시스템** (현재 토큰 기반):

| 토큰 | 값 | 사용처 |
|---|---|---|
| `--space-1` | 4px | 아이콘-텍스트 간격, Badge 내부 수직 패딩 |
| `--space-2` | 8px | 버튼 내부 패딩(세로), 필터 바 gap |
| `--space-3` | 12px | 필터 바 gap, 카드 내부 소간격 |
| `--space-4` | 16px | 카드 패딩, 모달 패딩 |
| `--space-5` | 20px | 사이드바 패딩 |
| `--space-6` | 24px | 페이지 헤더 bottom margin, 카드 간격 |
| `--space-8` | 32px | 섹션 간격 |
| `--space-10` | 40px | 큰 섹션 패딩 |
| `--space-12` | 48px | 페이지 상단 여백 |

**페이지 레이아웃 그리드**:
- 메인 콘텐츠 max-width: **1440px** (대형 모니터 대응)
- 콘텐츠 좌우 패딩: `28px` (현재 `.admin-main` 기준)
- 카드 그리드 gap: `20px`
- 대시보드 stat-grid: `repeat(4, 1fr)` → 태블릿 `repeat(2, 1fr)` → 모바일 `repeat(2, 1fr)`

### 2-4. 컴포넌트 상태 정의

모든 인터랙티브 컴포넌트는 다음 6가지 상태를 정의해야 한다:

| 상태 | 시각 처리 | 예시 |
|---|---|---|
| **Default** | 기본 스타일 | 버튼 기본 배경 |
| **Hover** | `background` 명도 조정 or `box-shadow` 추가 | 버튼 hover: `opacity 0.9` 또는 약간 어두운 배경 |
| **Active (Pressed)** | `transform: scale(0.98)` + `opacity 0.85` | 클릭 순간 |
| **Focus** | `outline: 2px solid var(--color-brand-500); outline-offset: 2px` | Tab 이동 시 |
| **Disabled** | `opacity: 0.45; cursor: not-allowed; pointer-events: none` | 비활성 버튼 |
| **Loading** | 버튼 내 spinner (16px) + 텍스트 유지 or 스켈레톤 | 제출 중 |

**Error 상태** (Input 전용):
- border-color: `var(--color-danger)` (#ef4444)
- 하단 에러 메시지: `color: var(--color-danger-text)`, font-size: `var(--text-sm)`
- 아이콘: `AlertCircle` (Lucide, 14px, danger 색상)

### 2-5. 아이콘 사용 가이드 (Lucide 기준)

**네비게이션 아이콘** (사이드바, size=16, strokeWidth=1.75):
| 메뉴 | 아이콘 | 비고 |
|---|---|---|
| 대시보드 | `LayoutDashboard` | 현재 구현됨 |
| 회원 관리 | `Users` | 현재 구현됨 |
| 사진 관리 | `Image` | 현재 구현됨 |
| 문의 관리 | `MessageSquare` | 현재 구현됨 |
| 시리즈 관리 | `BookOpen` | 현재 구현됨 |
| 통계 | `BarChart2` | 현재 구현됨 |
| 시스템 설정 | `Settings` | 현재 구현됨 |
| **콘텐츠 정책** | `Sliders` | 신규 |
| **신고 관리** | `Flag` | 신규 |
| **공지사항** | `Megaphone` | 신규 |
| **배너 관리** | `Layout` | 신규 |
| **태그/카테고리** | `Tag` | 신규 |

**액션 아이콘** (버튼 내부, size=14~16):
| 용도 | 아이콘 |
|---|---|
| 삭제 | `Trash2` |
| 수정/편집 | `Pencil` |
| 저장 | `Save` |
| 추가/생성 | `Plus` |
| 닫기 | `X` |
| 검색 | `Search` |
| 필터 | `Filter` |
| 다운로드 | `Download` |
| 업로드 | `Upload` |
| 새로고침 | `RefreshCw` |
| 외부 링크 | `ExternalLink` |
| 드래그 핸들 | `GripVertical` |
| 더보기 | `MoreHorizontal` |
| 펼침 | `ChevronDown` |
| 접힘 | `ChevronRight` |
| 이전/다음 | `ChevronLeft` / `ChevronRight` |
| 피처드 별표 | `Star` / `StarOff` |
| 복사 | `Copy` |
| 눈 보이기/숨기기 | `Eye` / `EyeOff` |
| 잠금 | `Lock` / `Unlock` |
| 경고 | `AlertTriangle` |
| 정보 | `Info` |

**크기 기준**:
- 사이드바 내: `size={16}` strokeWidth `1.75`
- 버튼 내부: `size={14}` strokeWidth `2`
- 단독 강조 아이콘 (StatCard): `size={20}` strokeWidth `1.75`
- 빈 상태 일러스트: `size={48}` strokeWidth `1.5`

---

## 3. 레이아웃 시스템 스펙

### 3-1. 사이드바 레이아웃 스펙

**확장형 (기본 / 데스크탑)**:
```
┌─────────────────────────────┐
│  ✦ Happiness Admin          │  height: 57px, padding: 20px 20px 16px
│                             │  border-bottom: 1px solid var(--color-sidebar-border)
├─────────────────────────────┤
│  ⊞ 대시보드                  │  padding: 10px 20px
│  ⊡ 회원 관리                 │  border-left: 3px solid transparent (비활성)
│▐ ⊡ 사진 관리  ← active      │  border-left: 3px solid var(--color-sidebar-active-text)
│  ⊡ 문의 관리    [●2]         │  미읽음 Badge (Phase 10-B)
│  ⊡ 시리즈 관리               │
│  ⊡ 통계                     │
│  ⊡ 시스템 설정               │
│  ⊡ 콘텐츠 정책               │  (신규)
│  ⊡ 신고 관리     [●3]        │  (신규)
│  ⊡ 공지사항                  │  (신규)
│  ⊡ 배너 관리                 │  (신규)
│  ⊡ 태그/카테고리             │  (신규)
├─────────────────────────────┤
│  [AD]  관리자                │  user-avatar 32px + user-name
│        WM                   │  user-role (text-xs, brand-400)
│  [로그아웃]                  │  logout-btn, hover → danger
└─────────────────────────────┘
  width: 240px, position: fixed
  background: var(--color-sidebar-bg) = #0f172a
```

**접힌형 (Phase 10-A / 데스크탑 토글)**:
```
┌──────┐
│  ✦   │  60px width
├──────┤
│  ⊞   │  아이콘만 표시, hover 시 tooltip
│  ⊡   │
│▐ ⊡   │  active: 좌측 border-left 유지
│  ⊡ ● │  Badge는 아이콘 우상단 표시
│  ⊡   │
├──────┤
│ [AD] │  avatar만 표시
└──────┘
  transition: width 0.2s ease
```

**상태 스타일**:
- 비활성 링크: color `#94a3b8`, background transparent
- Hover: background `#1e293b`, color `#e2e8f0`
- Active: background `#1e293b`, color `#818cf8`, border-left `3px solid #818cf8`, font-weight 600
- Active 아이콘: color `#818cf8` (brand-400)

### 3-2. 메인 콘텐츠 영역 스펙

```css
.admin-main {
  margin-left: 240px;      /* 사이드바 너비 */
  flex: 1;
  padding: 28px;
  min-height: 100vh;
  overflow: auto;
  background: var(--color-bg);   /* #f1f5f9 */
  max-width: calc(1440px + 240px);  /* 초대형 모니터 대응 */
}

/* 접힌 사이드바 시 (Phase 10-A) */
.admin-layout[data-sidebar-collapsed="true"] .admin-main {
  margin-left: 60px;
}
```

**콘텐츠 내부 최대 너비**: 별도 max-width 지정하지 않음 (페이지 전체 너비 사용). 단, 모달/SlideOver는 독립 max-width 적용.

**페이지 헤더 구조**:
```
┌────────────────────────────────────────────────────────────┐
│  페이지 제목(22px/700)         총 N건(13px/tertiary)  [버튼들] │
├────────────────────────────────────────────────────────────┤
│  [검색 인풋]  [필터 select]  [필터 select]                    │
└────────────────────────────────────────────────────────────┘
  .page-header: display:flex; align-items:center; gap:12px; margin-bottom:20px
  .filter-bar:  display:flex; gap:10px; margin-bottom:16px; flex-wrap:wrap
```

### 3-3. 반응형 브레이크포인트별 레이아웃

| 브레이크포인트 | 범위 | 레이아웃 |
|---|---|---|
| **Mobile** | ~767px | 사이드바 숨김(transform X), AdminHeader 표시, margin-left:0 |
| **Tablet** | 768px~1023px | 사이드바 표시(240px), 일부 그리드 2열 |
| **Desktop** | 1024px~1279px | 기본 레이아웃 |
| **Large** | 1280px~1439px | 기본 레이아웃 + 더 넓은 그리드 |
| **XLarge** | 1440px+ | max-width 제한 |

**브레이크포인트별 주요 변화**:
```css
/* Mobile (≤767px) */
@media (max-width: 767px) {
  .admin-main    { margin-left: 0; padding: 16px; }
  .stat-grid     { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .dashboard-grid { grid-template-columns: 1fr; }
  .stats-row     { flex-direction: column; }
  .table-card    { overflow-x: auto; }
  .data-table    { min-width: 600px; }
  .filter-bar    { flex-direction: column; }
  .search-input  { width: 100%; }
  .filter-select { width: 100%; }
}

/* Tablet (768px~1023px) */
@media (768px) and (max-width: 1023px) {
  .stat-grid     { grid-template-columns: repeat(2, 1fr); }
  .photo-grid    { grid-template-columns: repeat(3, 1fr); }
}

/* Photo Grid 반응형 */
@media (max-width: 639px)                       { .photo-grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 640px) and (max-width: 1023px) { .photo-grid { grid-template-columns: repeat(3, 1fr); } }
@media (min-width: 1024px)                      { .photo-grid { grid-template-columns: repeat(4, 1fr); } }
@media (min-width: 1400px)                      { .photo-grid { grid-template-columns: repeat(6, 1fr); } }
```

### 3-4. 오버레이/모달 레이어 시스템 (z-index)

```
z-index 계층 (낮음 → 높음):
────────────────────────────────
100  Sidebar (position:fixed)
150  Overlay (SlideOver/모달 배경 딤처리)
200  SlideOver Panel (우측 슬라이드)
300  Modal / ConfirmDialog
400  Toast (react-hot-toast, 기본 9999이나 프로젝트 내 상대 기준)
500  Tooltip
────────────────────────────────

규칙:
- 각 레이어는 해당 레이어의 배경 오버레이보다 z-index가 높아야 함
- ConfirmDialog가 SlideOver 위에 표시되어야 함 (SlideOver 내에서 삭제 확인 가능)
- Toast는 항상 최상단 (모달 열린 상태에서도 Toast 표시)
```

---

## 4. 공통 컴포넌트 상세 스펙

### 4-1. Button

**파일 위치**: `frontend/src/components/common/Button.jsx` (신규)

**Variant × Size 매트릭스**:

| Variant | 배경 | 텍스트 | 테두리 | 사용처 |
|---|---|---|---|---|
| `primary` | `var(--color-brand-500)` #6366f1 | #ffffff | none | 주요 저장/생성 액션 |
| `secondary` | `var(--color-surface-2)` #f8fafc | `var(--color-text-secondary)` | 1.5px solid `var(--color-border)` | 취소, 보조 액션 |
| `danger` | `var(--color-danger)` #ef4444 | #ffffff | none | 삭제 확인 |
| `ghost` | transparent | `var(--color-text-secondary)` | none | 아이콘 버튼, 보조 탐색 |
| `link` | transparent | `var(--color-brand-500)` | none | 인라인 텍스트 링크 |

| Size | height | padding | font-size | 아이콘 크기 |
|---|---|---|---|---|
| `sm` | 30px | 5px 12px | `--text-xs` (11px) | 12px |
| `md` (기본) | 36px | 8px 16px | `--text-sm` (13px) | 14px |
| `lg` | 42px | 10px 20px | `--text-base` (14px) | 16px |

**상태별 스타일**:
```css
/* Primary */
.btn-primary              { background: var(--color-brand-500); color: #fff; border-radius: var(--radius-md); font-weight: 600; transition: background 0.15s, box-shadow 0.15s; }
.btn-primary:hover        { background: var(--color-brand-600); }
.btn-primary:active       { background: var(--color-brand-700); transform: scale(0.98); }
.btn-primary:focus-visible { outline: 2px solid var(--color-brand-500); outline-offset: 2px; }
.btn-primary:disabled     { opacity: 0.45; cursor: not-allowed; }
.btn-primary.loading      { opacity: 0.7; pointer-events: none; }  /* 내부에 Spinner 표시 */

/* Danger */
.btn-danger               { background: var(--color-danger); color: #fff; border-radius: var(--radius-md); font-weight: 600; }
.btn-danger:hover         { background: #dc2626; }
.btn-danger:focus-visible { outline: 2px solid var(--color-danger); outline-offset: 2px; }

/* Secondary */
.btn-secondary            { background: var(--color-surface-2); color: var(--color-text-secondary); border: 1.5px solid var(--color-border); border-radius: var(--radius-md); font-weight: 600; }
.btn-secondary:hover      { background: var(--color-border); border-color: var(--color-border); }

/* Ghost */
.btn-ghost                { color: var(--color-text-secondary); border-radius: var(--radius-md); }
.btn-ghost:hover          { background: var(--color-surface-3); }
```

**사용 가이드**:
- 한 화면에 `primary` 버튼은 최대 1개 (주요 CTA)
- 삭제는 항상 `danger` + ConfirmDialog 조합
- 아이콘+텍스트 버튼: 아이콘은 텍스트 좌측, gap `6px`
- 아이콘 단독 버튼: `ghost` variant + `aria-label` 필수

### 4-2. Input & Textarea

**현재 구현된 `.search-input` 기반 확장**:

```css
/* 기본 Input */
.input {
  height: 36px;
  padding: 8px 14px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  font-family: var(--font-sans);
  color: var(--color-text-primary);
  background: var(--color-surface);
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  width: 100%;
}

/* Focus */
.input:focus {
  border-color: var(--color-brand-500);
  box-shadow: 0 0 0 3px var(--color-brand-50);
}

/* Error */
.input.input-error {
  border-color: var(--color-danger);
}
.input.input-error:focus {
  box-shadow: 0 0 0 3px var(--color-danger-bg);
}

/* Disabled */
.input:disabled {
  background: var(--color-surface-2);
  color: var(--color-text-tertiary);
  cursor: not-allowed;
  border-color: var(--color-border-light);
}
```

**Input with Icon (검색창)**:
```
┌─────────────────────────────────┐
│  🔍  검색어를 입력하세요...         │
└─────────────────────────────────┘
  position:relative 래퍼
  아이콘: position:absolute; left:12px; top:50%; transform:translateY(-50%); color: var(--color-text-tertiary)
  input: padding-left: 36px
```

**Textarea**:
- min-height: 80px
- resize: vertical only
- 나머지 스타일 Input과 동일

**에러 메시지**:
```
.input-error-msg {
  font-size: var(--text-xs);
  color: var(--color-danger-text);
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}
```

### 4-3. Select / Dropdown

현재 `.filter-select` 기반:
```css
.filter-select {
  height: 36px;
  padding: 0 32px 0 14px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  background: var(--color-surface) url("data:image/svg+xml,...chevron...") no-repeat right 10px center;
  background-size: 14px;
  appearance: none;
  cursor: pointer;
  color: var(--color-text-primary);
  outline: none;
  transition: border-color 0.15s;
}
.filter-select:focus-visible {
  outline: 2px solid var(--color-brand-500);
  outline-offset: 2px;
}
.filter-select:hover { border-color: #94a3b8; }
```

**사용 가이드**:
- 옵션 5개 이하: Select 사용
- 옵션 6개 이상 또는 검색 필요: Combobox (Phase 10 이후)
- 역할 변경 Select (테이블 인라인): `.role-select` — Badge 색상과 동일한 배경 적용

### 4-4. Badge

**역할별 Badge**:
```css
.badge         { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: var(--text-xs); font-weight: 600; white-space: nowrap; }
.badge-role-wm { background: var(--color-role-wm-bg);   color: var(--color-role-wm-text);  }  /* 웹관리자 */
.badge-role-sa { background: var(--color-role-sa-bg);   color: var(--color-role-sa-text);  }  /* 운영자 */
.badge-role-us { background: var(--color-role-us-bg);   color: var(--color-role-us-text);  }  /* 일반 회원 */
```

**상태별 Badge**:
```css
.badge-green   { background: var(--color-success-bg);  color: var(--color-success-text);  }  /* 읽음, 활성, 정상 */
.badge-red     { background: var(--color-danger-bg);   color: var(--color-danger-text);   }  /* 미읽음, 삭제됨, 차단 */
.badge-yellow  { background: var(--color-warning-bg);  color: var(--color-warning-text);  }  /* 대기중, 보류 */
.badge-blue    { background: var(--color-role-sa-bg);  color: var(--color-role-sa-text);  }  /* 정보, SA 역할 */
.badge-purple  { background: var(--color-role-wm-bg);  color: var(--color-role-wm-text);  }  /* WM 역할 */
.badge-cyan    { background: var(--color-info-bg);     color: var(--color-info-text);     }  /* 피처드, 추천 */
```

**무드별 Badge (사진 colorMood)**:
```css
.badge-mood-warm    { background: #fff7ed; color: #c2410c; }  /* WARM */
.badge-mood-cool    { background: #eff6ff; color: #1d4ed8; }  /* COOL */
.badge-mood-neutral { background: #f8fafc; color: #475569; }  /* NEUTRAL */
.badge-mood-vivid   { background: #fdf4ff; color: #9333ea; }  /* VIVID */
.badge-mood-dark    { background: #1e293b; color: #94a3b8; }  /* DARK */
.badge-mood-soft    { background: #fdf2f8; color: #be185d; }  /* SOFT */
```

### 4-5. Table

**구조 스펙**:
```
┌──────────────────────────────────────────────────────────────┐
│  컬럼명 ↕  │  컬럼명    │  컬럼명      │  상태   │  관리      │  ← thead
│  background: var(--color-surface-2), border-bottom: 1px solid var(--color-border)
├──────────────────────────────────────────────────────────────┤
│  셀 내용   │  셀 내용   │  셀 내용     │ [Badge] │ [버튼][버튼]│  ← tbody tr
│  셀 내용   │  셀 내용   │  셀 내용     │ [Badge] │ [버튼][버튼]│
│  셀 내용 ← hover시 background: var(--color-surface-2)        │
└──────────────────────────────────────────────────────────────┘
```

```css
.data-table th {
  padding: 12px 14px;
  background: var(--color-surface-2);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-secondary);
  border-bottom: 1px solid var(--color-border);
  text-align: left;
  white-space: nowrap;
}

/* 정렬 가능 컬럼 */
.data-table th.sortable { cursor: pointer; user-select: none; }
.data-table th.sortable:hover { color: var(--color-text-primary); }
.data-table th.sort-asc  .sort-icon { color: var(--color-brand-500); transform: rotate(180deg); }
.data-table th.sort-desc .sort-icon { color: var(--color-brand-500); }

.data-table td {
  padding: 11px 14px;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  border-bottom: 1px solid var(--color-border-light);
  vertical-align: middle;
}

.data-table tr:last-child td { border-bottom: none; }
.data-table tr:hover td      { background: var(--color-surface-2); }

/* Sticky 헤더 (긴 테이블) */
.table-card { overflow: hidden; border-radius: var(--radius-lg); box-shadow: var(--shadow-md); }
.data-table thead th { position: sticky; top: 0; z-index: 1; }
```

**미읽음 행 강조**:
```css
.unread-row td            { background: #fffdf5; }
.unread-row:hover td      { background: #fffbeb; }
.unread-row .sender-name  { font-weight: 600; color: var(--color-text-primary); }
```

**관리 컬럼**:
- 항상 우측 고정, width: auto (min-width: 80px)
- 버튼 gap: `6px`
- 기본: `.btn-danger-sm` (삭제) + 선택적 `.btn-action` (읽음/수정)

### 4-6. Card

**StatCard** (대시보드 KPI):
```
┌──────────────────────────────────────┐
│  [아이콘]   3,421                     │  ← stat-value: 28px/700
│  ▌          전체 회원                 │  ← stat-label: 13px/400/tertiary
│             +12 오늘               ↗ │  ← 증감 + ArrowUpRight
└──────────────────────────────────────┘
  border-left: 4px solid [color]
  padding: 18px 20px
  cursor: pointer
  transition: box-shadow 0.15s, transform 0.15s
  hover: box-shadow var(--shadow-md), transform: translateY(-1px)
```

**ContentCard** (테이블 래퍼):
```css
.table-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}
```

**ChartCard** (차트 래퍼):
```css
.stats-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: 20px 24px;
  margin-bottom: 20px;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
```

### 4-7. Pagination

현재 구현 기반 스펙:
```css
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  padding: 20px 0;
}

.page-btn {
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
  background: var(--color-surface);
  border: 1.5px solid var(--color-border);
  cursor: pointer;
  transition: all 0.12s;
}

.page-btn:hover:not(:disabled) {
  border-color: var(--color-brand-400);
  color: var(--color-brand-500);
}

.page-btn.active {
  background: var(--color-brand-500);
  color: #ffffff;
  border-color: var(--color-brand-500);
  font-weight: 700;
}

.page-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
```

### 4-8. Modal / Confirm Dialog

현재 `ConfirmDialog.jsx` 기반 확장 스펙:

```
┌────────────────────────────────────────┐  max-width: 420px
│  [⚠ 아이콘 44px circle]                │  padding: 28px 28px 24px
│                                        │  border-radius: var(--radius-xl) = 16px
│  모달 제목 (18px/700)                   │
│  설명 텍스트 (13px/secondary/lh:1.6)   │
│                                        │
│                     [취소] [확인]       │  취소: secondary, 확인: danger/warning
└────────────────────────────────────────┘

오버레이: rgba(0,0,0,0.45), z-index: var(--z-modal) = 300
진입 애니메이션:
  overlay: opacity 0 → 1, duration 0.15s
  dialog:  opacity 0 + translateY(8px) + scale(0.98) → 정상, duration 0.18s

body overflow:hidden (열린 동안)
ESC 키 닫기
오버레이 클릭 닫기
기본 포커스: 취소 버튼 (안전한 기본값 원칙)
```

**범용 Modal** (ConfirmDialog 외 콘텐츠 모달):
- max-width: 560px (중간), 720px (넓은 폼)
- header: 타이틀 + X 닫기 버튼
- body: scrollable (max-height: calc(100vh - 200px))
- footer: border-top + 버튼 그룹 (우측 정렬)

### 4-9. Toast / Notification

현재 `react-hot-toast` 기반 설정:
```jsx
toastOptions={{
  success: {
    duration: 3000,
    style: {
      background: '#0f172a',
      color: '#e2e8f0',
      fontSize: '13px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
    },
    iconTheme: { primary: '#22c55e', secondary: '#0f172a' }
  },
  error: {
    duration: 5000,
    style: {
      background: '#0f172a',
      color: '#fca5a5',
      fontSize: '13px',
      borderRadius: '8px'
    }
  }
}}
```

**Toast 메시지 톤 가이드**:
| 상황 | 메시지 예시 |
|---|---|
| 삭제 성공 | "회원이 삭제되었습니다." |
| 수정 성공 | "변경사항이 저장되었습니다." |
| 읽음 처리 | "읽음 처리되었습니다." |
| API 실패 | "저장에 실패했습니다. 잠시 후 다시 시도해주세요." |
| 네트워크 오류 | "서버에 연결할 수 없습니다." |

### 4-10. Empty State

```
┌───────────────────────────────────────┐
│                                       │
│           [아이콘 48px]               │  opacity: 0.35, color: tertiary
│                                       │
│     데이터가 없습니다.                  │  15px/600/secondary
│   검색 조건을 변경하거나 새로 추가하세요  │  13px/400/tertiary
│                                       │
│           [추가하기]                   │  optional, primary 버튼
│                                       │
└───────────────────────────────────────┘
  padding: 60px 20px
  text-align: center
```

```css
.empty-state       { text-align: center; padding: 60px 20px; }
.empty-state-icon  { color: var(--color-text-tertiary); opacity: 0.4; margin-bottom: 16px; }
.empty-state-title { font-size: var(--text-md); font-weight: 600; color: var(--color-text-secondary); margin-bottom: 8px; }
.empty-state-desc  { font-size: var(--text-sm); color: var(--color-text-tertiary); line-height: 1.6; }
```

아이콘 선택 기준:
- 검색 결과 없음: `SearchX`
- 데이터 없음 (일반): `Inbox`
- 사진 없음: `ImageOff`
- 문의 없음: `MessageCircleOff`
- 시리즈 없음: `BookMarked`

### 4-11. Loading State (Skeleton, Spinner)

**Skeleton** (리스트/카드 초기 로딩):
```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-surface-2) 25%,
    var(--color-border-light) 50%,
    var(--color-surface-2) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
}

@keyframes skeleton-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* 사용 예 */
.skeleton-text  { height: 14px; margin-bottom: 8px; }
.skeleton-title { height: 22px; width: 40%; margin-bottom: 16px; }
.skeleton-row   { height: 44px; margin-bottom: 1px; }
```

**Spinner** (버튼 내부, 부분 로딩):
```css
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

**페이지 전체 로딩**: `.page-loading { text-align:center; padding:80px; color: var(--color-text-tertiary); font-size: var(--text-md); }`

### 4-12. SlideOver Panel

**파일 위치**: `frontend/src/components/common/SlideOver.jsx` (Phase 10-C 신규)

```
┌────────────────────────────────────────────────────────────────┐
│ 페이지 콘텐츠 (dimmed overlay)            ┌──────────────────┐  │
│                                           │  패널 타이틀  [X] │  │  height: 56px
│                                           ├──────────────────┤  │  border-bottom
│                                           │                  │  │
│                                           │  패널 내용        │  │  overflow-y: auto
│                                           │  (scrollable)    │  │
│                                           │                  │  │
│                                           ├──────────────────┤  │
│                                           │  [취소] [저장]    │  │  optional footer
│                                           └──────────────────┘  │
└────────────────────────────────────────────────────────────────┘
  width: var(--slideover-width) = 420px (기본)
       var(--slideover-width-lg) = 560px (넓은 패널)
  position: fixed; right:0; top:0; bottom:0;
  z-index: var(--z-slideover) = 200
  background: var(--color-surface)
  box-shadow: -4px 0 24px rgba(0,0,0,0.12)
  transform: translateX(100%) → translateX(0)
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)
```

```css
.slide-over {
  position: fixed;
  right: 0; top: 0; bottom: 0;
  width: var(--slideover-width);
  background: var(--color-surface);
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.12);
  z-index: var(--z-slideover);
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-over.open { transform: translateX(0); }

.slide-over-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
  min-height: 56px;
}

.slide-over-title  { font-size: var(--text-lg); font-weight: 700; }
.slide-over-body   { flex: 1; overflow-y: auto; padding: 20px; }
.slide-over-footer { padding: 16px 20px; border-top: 1px solid var(--color-border); display: flex; gap: 10px; justify-content: flex-end; }

.slide-over-overlay {
  position: fixed; inset: 0;
  background: var(--color-overlay-light);
  z-index: calc(var(--z-slideover) - 1);
  opacity: 0;
  transition: opacity 0.25s;
}
.slide-over-overlay.open { opacity: 1; }
```

---

## 5. 신규 페이지별 UX/UI 스펙

### 5-1. 콘텐츠 정책 관리 페이지

**URL**: `/content-policy`
**사이드바 아이콘**: `Sliders`
**접근 권한**: WM 전용

**페이지 목적**: 앱의 기본 정렬 순서(최신/인기/추천)와 피처드(메인 노출) 콘텐츠를 설정. 플랫폼 UX의 핵심 노출 정책을 한 곳에서 관리.

**화면 구조**:
```
┌────────────────────────────────────────────────────────────────┐
│  콘텐츠 정책 관리                                                 │  page-title
├──────────────────────────────┬─────────────────────────────────┤
│  정렬 정책                    │  피처드 콘텐츠                    │  두 섹션 나란히 (2열 grid)
│  ┌────────────────────────┐  │  ┌────────────────────────────┐ │
│  │ 기본 정렬 순서          │  │  │  피처드 사진 (최대 10개)    │ │
│  │                        │  │  │                            │ │
│  │ ◉ 최신순 (최근 업로드)  │  │  │  [추가] ──────────────     │ │
│  │ ○ 인기순 (좋아요/저장)  │  │  │  ┌────┐ ┌────┐ ┌────┐    │ │
│  │ ○ 추천순 (큐레이션)     │  │  │  │ ⠿  │ │ ⠿  │ │ ⠿  │    │ │ ← 드래그 핸들
│  │                        │  │  │  │사진1│ │사진2│ │사진3│    │ │
│  │ 신규 콘텐츠 반영 기간   │  │  │  └────┘ └────┘ └────┘    │ │
│  │ [7일 ▼]                │  │  │   (드래그로 순서 변경)      │ │
│  │                        │  │  ├────────────────────────────┤ │
│  │          [저장]         │  │  │  피처드 시리즈 (최대 5개)  │ │
│  └────────────────────────┘  │  └────────────────────────────┘ │
└──────────────────────────────┴─────────────────────────────────┘
```

**핵심 인터랙션 플로우**:

1. **정렬 정책 변경**:
   - 라디오 그룹에서 선택 → "저장" 클릭 → ConfirmDialog ("정렬 정책을 변경하면 앱의 피드 순서가 즉시 바뀝니다.") → 확인 → PATCH API → Toast 성공

2. **피처드 사진 추가**:
   - [추가] 버튼 → 사진 검색 Modal (검색 인풋 + 사진 그리드) → 선택 → 목록에 추가 → [저장] 클릭 → API

3. **피처드 순서 변경**:
   - 카드 좌측 `GripVertical` 아이콘 드래그 → 순서 변경 → 자동 저장 or [저장] 버튼

4. **피처드 제거**:
   - 카드 우상단 `X` 버튼 → 즉시 제거 (낙관적 업데이트) → API 호출

**컴포넌트 조합**:
- `RadioGroup` + `Select` (정렬 기간)
- `DraggableList` + `FeaturedCard` (피처드 아이템)
- `PhotoSearchModal` (검색 + 선택 모달)

**엣지 케이스**:
- 피처드 목록 비어있음: Empty State ("피처드 사진이 없습니다. 추가해보세요.")
- 드래그 중 다른 탭으로 이동: 변경사항 유실 경고 (beforeunload)
- API 실패 시 낙관적 업데이트 롤백

### 5-2. 회원 상세 SlideOver/페이지

**트리거**: 회원 목록 테이블에서 이름 셀 클릭
**컴포넌트**: `SlideOver` (width: 560px)

**패널 구조**:
```
┌───────────────────────────────────────────┐
│  [AD] 홍길동                           [X] │  header
│       hong@example.com                    │
├───────────────────────────────────────────┤
│  기본 정보                                 │  section
│  ┌────────────────────────────────────┐   │
│  │ 이름      │ 홍길동                  │   │
│  │ 이메일    │ hong@example.com        │   │
│  │ 프로필명  │ @hong_photo             │   │
│  │ 역할      │ [US ▼]  ← Select        │   │
│  │ 가입일    │ 2025-03-15              │   │
│  └────────────────────────────────────┘   │
│                                           │
│  사진 (12장)                              │  section
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐          │  3×2 mini grid
│  │  │ │  │ │  │ │  │ │  │ │  │          │
│  └──┘ └──┘ └──┘ └──┘ └──┘ └──┘          │
│  [사진 관리에서 보기 →]                   │
│                                           │
│  최근 문의 (3건)                           │  section
│  • 2025-06-10 웨딩 문의 [읽음]            │
│  • 2025-06-05 스냅 문의 [미읽음]          │
├───────────────────────────────────────────┤
│  [회원 삭제]              [역할 변경 저장] │  footer
└───────────────────────────────────────────┘
```

**핵심 인터랙션**:
- 역할 Select 변경 → footer의 [역할 변경 저장] 활성화 → 클릭 → ConfirmDialog → API
- [회원 삭제] → ConfirmDialog (danger) → API → SlideOver 닫기 → Toast → 목록 갱신
- 사진 미니 그리드: 클릭 시 `/photos?memberId=xxx` 로 이동
- API 로딩: 패널 body에 Skeleton 표시

### 5-3. 신고 관리 페이지

**URL**: `/reports`
**사이드바 아이콘**: `Flag`

**페이지 목적**: 사용자가 신고한 콘텐츠(사진, 문의, 프로필)를 검토하고 처리(승인/반려/콘텐츠 삭제).

**화면 구조**:
```
┌────────────────────────────────────────────────────────────────┐
│  신고 관리                      총 23건 (미처리 8건)              │
├────────────────────────────────────────────────────────────────┤
│  [전체 ▼]  [신고 유형 ▼]  [처리 상태 ▼]   [검색...]             │
├────────────────────────────────────────────────────────────────┤
│  신고자    │ 대상 콘텐츠    │ 신고 사유    │ 접수일  │ 상태  │ 관리 │
├────────────────────────────────────────────────────────────────┤
│  홍길동    │ [사진] 봄날의… │ 부적절 콘텐츠│ 06-10  │[미처리]│[검토]│  ← 미처리 행: 배경 강조
│  김철수    │ [문의] 웨딩…   │ 스팸        │ 06-09  │[처리됨]│      │
└────────────────────────────────────────────────────────────────┘
```

**신고 검토 SlideOver** (행의 [검토] 버튼 클릭):
```
┌─────────────────────────────────────────────┐
│  신고 #1234 — 검토                       [X]│
├─────────────────────────────────────────────┤
│  신고 정보                                   │
│  신고자: 홍길동 (hong@example.com)           │
│  신고 유형: 부적절 콘텐츠                     │
│  신고 사유: "해당 사진에 노출이 포함되어 있음" │
│                                             │
│  대상 콘텐츠 (사진)                          │
│  ┌─────────────────────────────────────┐   │
│  │         [사진 미리보기]              │   │  max-height: 240px
│  └─────────────────────────────────────┘   │
│  제목: 봄날의 추억                           │
│  작가: 이영희 (@yi_photo)                   │
│  업로드: 2025-05-20                         │
│                                             │
│  처리 메모 (선택)                            │
│  ┌─────────────────────────────────────┐   │
│  │ 검토 내용을 입력하세요...            │   │  Textarea
│  └─────────────────────────────────────┘   │
├─────────────────────────────────────────────┤
│  [반려 (신고 기각)]  [콘텐츠 삭제 후 처리]   │  footer
└─────────────────────────────────────────────┘
```

**처리 워크플로우**:
1. [반려] → ConfirmDialog (warning, "이 신고를 기각합니다.") → PATCH status=REJECTED → Toast
2. [콘텐츠 삭제 후 처리] → ConfirmDialog (danger, "콘텐츠가 삭제되며 신고가 처리됩니다.") → DELETE 콘텐츠 API + PATCH status=RESOLVED → Toast

**상태 뱃지**:
- 미처리: `badge-yellow` + 행 배경 `#fffbeb`
- 처리됨 (삭제): `badge-red`
- 처리됨 (기각): `badge-green`

### 5-4. 공지사항 관리 페이지

**URL**: `/notices`
**사이드바 아이콘**: `Megaphone`

**목록 페이지 구조**:
```
┌────────────────────────────────────────────────────────────────┐
│  공지사항 관리                  총 8건   [+ 새 공지 작성]         │
├────────────────────────────────────────────────────────────────┤
│  제목           │ 상태    │ 노출 기간          │ 작성일  │ 관리   │
├────────────────────────────────────────────────────────────────┤
│  서비스 점검 안내│ [게시중]│ 2025-06-01 ~ 상시 │ 06-01  │[수정][삭제]│
│  기능 업데이트  │ [예약됨]│ 2025-07-01 ~       │ 06-10  │[수정][삭제]│
│  이벤트 종료    │ [종료됨]│ ~ 2025-05-31       │ 05-01  │[수정][삭제]│
└────────────────────────────────────────────────────────────────┘
```

**공지 에디터** (목록 위 슬라이드인 또는 별도 페이지 `/notices/new`, `/notices/:id/edit`):
```
┌────────────────────────────────────────────────────────────────┐
│  새 공지사항 작성                                                 │
├────────────────────────────────────────────────────────────────┤
│  제목                                                           │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ 공지 제목을 입력하세요                                     │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  내용 (Markdown 지원)                                           │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                                                          │ │
│  │ 공지 내용을 입력하세요...                                  │ │  min-height: 240px
│  │                                                          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  노출 기간                           노출 대상                   │
│  시작: [2025-06-01 ──] 종료: [상시 ─] ◉ 전체  ○ WM  ○ SA      │
│                                                                │
│  상태: ◉ 게시  ○ 임시저장  ○ 예약                                │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                              [취소]  [임시저장]  [게시하기]       │
└────────────────────────────────────────────────────────────────┘
```

**상태 뱃지**:
- 게시중: `badge-green`
- 예약됨: `badge-blue`
- 임시저장: `badge-yellow`
- 종료됨: badge (background: `--color-surface-2`, color: `--color-text-tertiary`)

### 5-5. 배너 관리 페이지

**URL**: `/banners`
**사이드바 아이콘**: `Layout`

**화면 구조**:
```
┌────────────────────────────────────────────────────────────────┐
│  배너 관리                  총 4개    [+ 새 배너 추가]            │
├────────────────────────────────────────────────────────────────┤
│  ⚠️ 드래그로 노출 순서를 변경할 수 있습니다.   [순서 저장]          │  변경 시 버튼 활성화
├────────────────────────────────────────────────────────────────┤
│  ⠿  #1  ┌──────────────────────────────┐  메인 이벤트 배너      │  ← drag handle
│         │       [배너 이미지 미리보기]   │  기간: 06-01 ~ 06-30  │
│         │       (16:9 비율)             │  링크: /event/summer  │
│         └──────────────────────────────┘  상태: [게시중] [수정][삭제]│
│                                                                │
│  ⠿  #2  ┌──────────────────────────────┐  작가 모집 배너        │
│         │       [배너 이미지 미리보기]   │  기간: 상시            │
│         └──────────────────────────────┘  [게시중] [수정][삭제] │
└────────────────────────────────────────────────────────────────┘
```

**배너 추가/수정 Modal** (max-width: 560px):
```
┌─────────────────────────────────────────────┐
│  배너 추가                              [X]  │
├─────────────────────────────────────────────┤
│  이미지 업로드                               │
│  ┌───────────────────────────────────────┐  │
│  │                                       │  │  drag & drop 또는 클릭 업로드
│  │   📁 이미지를 드래그하거나 클릭하세요   │  │  권장: 1920×640px (3:1)
│  │                                       │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  제목: [                            ]       │
│  링크 URL: [                        ]       │
│  노출 기간: [시작 ──] ~ [종료 ──] or [상시]  │
│  상태: ◉ 게시  ○ 비게시                      │
├─────────────────────────────────────────────┤
│                         [취소]  [저장]       │
└─────────────────────────────────────────────┘
```

**드래그 앤 드롭 UX**:
- `GripVertical` 아이콘이 드래그 핸들
- 드래그 중: 해당 아이템 `opacity: 0.5` + 나머지 자리에 드롭 가이드라인 표시
- 드롭 후: 순서 변경 반영, [순서 저장] 버튼 활성화
- [순서 저장] 클릭 → API (배너 ID 배열 순서 전송) → Toast

### 5-6. 태그/카테고리 관리 페이지

**URL**: `/tags`
**사이드바 아이콘**: `Tag`

**화면 구조 (2열)**:
```
┌───────────────────────────┬────────────────────────────────────┐
│  촬영 유형 (shootType)      │  색채 무드 (colorMood)              │
│                            │                                    │
│  [+ 추가]                  │  [+ 추가]                          │
│  ┌───────────────────────┐ │  ┌──────────────────────────────┐ │
│  │ 웨딩       12건 [수정][삭제]│ │  │ WARM  (따뜻함) 8건 [수정][삭제]│ │
│  │ 가족       5건  [수정][삭제]│ │  │ COOL  (차가움) 6건 [수정][삭제]│ │
│  │ 프로필     18건 [수정][삭제]│ │  │ VIVID (선명함) 4건 [수정][삭제]│ │
│  │ 스냅       9건  [수정][삭제]│ │  └──────────────────────────────┘ │
│  └───────────────────────┘ │                                    │
└───────────────────────────┴────────────────────────────────────┘
```

**인라인 편집**: 태그 이름 클릭 → 인풋으로 전환 → 엔터/저장 → API
**삭제 규칙**: 해당 태그를 사용하는 콘텐츠가 있으면 삭제 불가. ConfirmDialog에 "이 태그를 사용하는 사진 N개가 있습니다. 삭제하면 해당 사진의 태그가 제거됩니다." 경고.

### 5-7. 고도화 통계 대시보드

**URL**: `/stats` (기존 페이지 확장)

**추가 섹션 구조**:
```
┌────────────────────────────────────────────────────────────────┐
│  통계                               [7일] [30일] [90일]         │
├────────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                        │  KPI 카드 3개
│  │사진 업로드│ │ 신규 가입 │ │ 문의 접수 │                        │
│  │  +247    │ │   +89    │ │   +156   │                        │
│  └──────────┘ └──────────┘ └──────────┘                        │
├────────────────────────────────────────────────────────────────┤
│  기간별 추이 (LineChart)                  [CSV 내보내기 ↓]       │
│  ────────────────────────────────────────────────────────────  │
├──────────────────────────┬─────────────────────────────────────┤
│  색채 무드 분포 (PieChart) │  촬영 종류별 문의 (HorizontalBar)   │
├──────────────────────────┴─────────────────────────────────────┤
│  인기 사진 TOP 10 (Table + 좋아요/저장/공유 순 필터)              │
├────────────────────────────────────────────────────────────────┤
│  작가 퍼포먼스 TOP 10                                            │  신규
│  작가명 │ 업로드 │ 평균 좋아요 │ 총 저장 │ 문의 수 │ 전환율      │
├────────────────────────────────────────────────────────────────┤
│  코호트 분석 (월별 가입 코호트 × 활동 유지율)                     │  신규
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 가입 코호트 │ 1개월 │ 2개월 │ 3개월 │ 4개월 │ 5개월      │  │
│  │ 2025-01    │  82%  │  71%  │  65%  │  58%  │  52%       │  │
│  │ 2025-02    │  79%  │  68%  │  61%  │  54%  │  -         │  │
│  └──────────────────────────────────────────────────────────┘  │
│  색상 스케일: 100%=#22c55e → 50%=#f59e0b → 0%=#ef4444          │
└────────────────────────────────────────────────────────────────┘
```

**코호트 테이블 색상 스케일** (히트맵):
```javascript
const getCohortColor = (rate) => {
  if (rate >= 80) return { bg: '#dcfce7', text: '#16a34a' };
  if (rate >= 60) return { bg: '#d1fae5', text: '#059669' };
  if (rate >= 40) return { bg: '#fef9c3', text: '#a16207' };
  if (rate >= 20) return { bg: '#ffe4e6', text: '#be123c' };
  return { bg: '#fecdd3', text: '#9f1239' };
};
```

---

## 6. 인터랙션 & 마이크로 애니메이션 가이드

### 6-1. 전환 효과 기준

**허용 duration 범위**: 100ms~300ms. 운영 도구에서 250ms 이상 애니메이션은 "느리다"는 인상을 준다.

| 용도 | duration | easing |
|---|---|---|
| 버튼 Hover/Active | 120ms | `ease` |
| 색상/배경 전환 | 150ms | `ease` |
| 모달 등장 (overlay) | 150ms | `ease` |
| 모달 등장 (dialog) | 180ms | `ease` |
| SlideOver 열기/닫기 | 250ms | `cubic-bezier(0.16, 1, 0.3, 1)` |
| 사이드바 접기/펼치기 | 200ms | `ease` |
| Skeleton shimmer | 1500ms | `linear` (loop) |
| Spinner 회전 | 700ms | `linear` (loop) |
| 행 강조 (미읽음 배경) | 없음 | — |

### 6-2. 허용 vs 금지 애니메이션

**허용**:
- 모달/SlideOver 진입 시 slide + fade
- 버튼 hover/active 색상 전환
- Toast 등장 fade + slide
- 사이드바 width collapse transition
- 테이블 행 hover 배경 전환
- 뱃지 Unread dot pulse (최대 1회, 2s간격 권장)

**금지**:
- 페이지 전환 시 전체 화면 fade/slide (React Router 전환은 즉시)
- 리스트 아이템 stagger animation (정보 밀도 저해)
- 숫자 카운트업 애니메이션 (KPI 수치)
- 파티클, confetti, 축하 효과
- hover 시 요소 크기 변화 (layout shift 유발)
- bounce easing (`cubic-bezier(0.68,-0.55,0.27,1.55)` 금지)

### 6-3. 상태 전환 패턴

**로딩 → 완료**:
```
초기: Skeleton 표시
API 응답 수신: Skeleton 즉시 제거 → 실제 데이터 표시 (transition 없음)
이유: 깜빡임보다 즉각 갱신이 운영 도구에서 더 자연스럽다
```

**에러 → 복구**:
```
에러 발생: Toast(error) + 에러 메시지 인라인 표시
[재시도] 버튼: 클릭 → 로딩 상태 → 성공/재에러
에러 메시지: role="alert" aria-live="assertive"
```

**Submit → 완료**:
```
버튼 클릭: 버튼 내부 Spinner + disabled (이중 제출 방지)
성공: 버튼 원복 → SlideOver/Modal 닫기 → Toast + 목록 갱신
실패: 버튼 원복 → 인라인 에러 메시지 표시
```

### 6-4. 드래그 앤 드롭

**배너 순서 변경, 피처드 콘텐츠 순서**:

```
드래그 시작:
  - 드래그 중인 아이템: opacity: 0.5, box-shadow 강조
  - 커서: grabbing

드래그 오버:
  - 드롭 가능한 위치: 2px 파란 선 표시 (border-top/bottom: 2px solid var(--color-brand-500))
  - 아이템 위치 shift: transform: translateY(±Npx) transition: 150ms

드롭:
  - 순서 배열 state 업데이트
  - [저장] 버튼 활성화 (미저장 변경사항 표시)
  - 성공 Toast

취소 (ESC):
  - 원래 순서 복원
```

라이브러리: `@dnd-kit/core` + `@dnd-kit/sortable` (권장) 또는 `react-beautiful-dnd`

---

## 7. 접근성(Accessibility) 스펙

### 7-1. WCAG 2.1 AA 기준 적용 범위

| 기준 | 적용 여부 | 세부 내용 |
|---|---|---|
| 색상 대비 4.5:1 (일반 텍스트) | 필수 | 모든 텍스트 컬러 조합 검증 |
| 색상 대비 3:1 (큰 텍스트 18px+) | 필수 | 페이지 타이틀, KPI 수치 |
| 키보드 내비게이션 | 필수 | Tab 이동, Enter 확인, Escape 닫기 |
| Focus 표시 | 필수 | outline 2px brand-500 |
| 대체 텍스트 | 필수 | img alt, 아이콘 버튼 aria-label |
| 에러 식별 | 필수 | role="alert", aria-invalid |
| 모달 focus trap | 필수 | 모달 열릴 때 내부로 focus 이동 |

### 7-2. 색상 대비율 체크

| 전경 | 배경 | 비율 | 합격 |
|---|---|---|---|
| `#0f172a` (text-primary) | `#ffffff` (surface) | 19.1:1 | AA |
| `#475569` (text-secondary) | `#ffffff` | 7.0:1 | AA |
| `#94a3b8` (text-tertiary) | `#ffffff` | 3.7:1 | AA (큰 텍스트만) |
| `#ffffff` | `#6366f1` (brand-500) | 4.5:1 | AA |
| `#16a34a` (success-text) | `#dcfce7` (success-bg) | 4.7:1 | AA |
| `#dc2626` (danger-text) | `#fef2f2` (danger-bg) | 5.9:1 | AA |
| `#d97706` (warning-text) | `#fffbeb` (warning-bg) | 4.6:1 | AA |
| `#94a3b8` (sidebar-text) | `#0f172a` (sidebar-bg) | 4.6:1 | AA |
| `#818cf8` (sidebar-active) | `#0f172a` | 5.5:1 | AA |

> **주의**: `--color-text-tertiary` (#94a3b8)는 흰 배경에서 3.7:1로 일반 텍스트(14px) 기준 AA 미달. 반드시 큰 텍스트(18px+) 또는 보조 정보에만 사용.

### 7-3. 키보드 내비게이션 플로우

```
전역:
Tab    → 다음 포커스 가능 요소
Shift+Tab → 이전 포커스 가능 요소
Enter/Space → 버튼/링크 활성화
Escape → 모달/SlideOver/Dropdown 닫기

테이블:
Tab → 셀 내 인터랙티브 요소(버튼, Select)로 이동
Enter → 행 확장 (expandable row)

모달/ConfirmDialog:
열릴 때: focus → 첫 번째 포커스 가능 요소 (기본: 취소 버튼)
Tab → 내부 순환 (focus trap, 외부 요소 접근 불가)
Escape → 닫기 (onCancel 호출)

SlideOver:
열릴 때: focus → 닫기(X) 버튼
Escape → 닫기

사이드바 링크:
Enter → 페이지 이동
```

### 7-4. aria 레이블 가이드

**필수 aria 속성**:
```jsx
/* 아이콘 전용 버튼 */
<button aria-label="문의 삭제">
  <Trash2 size={14} aria-hidden="true" />
</button>

/* 로딩 버튼 */
<button disabled aria-busy="true" aria-label="저장 중">
  <Spinner aria-hidden="true" /> 저장 중...
</button>

/* 에러 메시지 */
<div role="alert" aria-live="assertive" className="login-error">
  이메일 또는 비밀번호가 올바르지 않습니다.
</div>

/* 모달 */
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <h2 id="modal-title">회원 삭제</h2>
</div>

/* Toast */
/* react-hot-toast: 기본 role="status" 적용됨. error는 role="alert" 별도 설정 */

/* 정렬 가능 테이블 헤더 */
<th aria-sort="ascending" aria-label="가입일 기준 오름차순 정렬">
  가입일 <ChevronUp aria-hidden="true" />
</th>

/* 페이지네이션 */
<nav aria-label="페이지 내비게이션">
  <button aria-label="이전 페이지" aria-disabled={page === 0}>‹</button>
  <button aria-label="3페이지" aria-current={page === 2 ? 'page' : undefined}>3</button>
</nav>

/* Badge (상태 전달) */
<span className="badge badge-red" role="status">
  미읽음
</span>
```

### 7-5. 스크린리더 대응

**테이블**:
- `<table>` 에 `role="grid"` 대신 `role="table"` 유지 (데이터 테이블)
- 복잡한 컬럼(아이콘+텍스트)은 `<td>` 내 `aria-label` 또는 `<span className="sr-only">` 사용

**모달**: `aria-modal="true"` + focus trap + `aria-labelledby`

**Toast**: success는 `role="status"` (방해하지 않음), error는 `role="alert"` (즉시 읽음)

**이미지 대체**: `<ImgWithFallback alt="사진 제목">` — alt는 항상 의미 있는 텍스트. 장식용 이미지는 `alt=""`

`.sr-only` 유틸리티 클래스 (global.css에 추가):
```css
.sr-only {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

---

## 8. 데이터 시각화 스펙

### 8-1. 차트 컬러 팔레트 (8색)

```javascript
// frontend/src/constants/chart.js
export const CHART_COLORS = [
  '#6366f1',  // Indigo  — 기본 (사진 업로드, 주요 지표)
  '#22c55e',  // Green   — 성장 지표 (신규 가입, 증가)
  '#f59e0b',  // Amber   — 주의 지표 (문의 접수, 대기)
  '#ef4444',  // Red     — 위험 지표 (미처리, 감소)
  '#06b6d4',  // Cyan    — 정보 지표 (조회수)
  '#a855f7',  // Purple  — 부가 지표 (저장, 공유)
  '#ec4899',  // Pink    — 특수 지표 (좋아요)
  '#84cc16',  // Lime    — 보조 지표 (기타)
];

// 무드별 색상 (PieChart용)
export const MOOD_COLORS = {
  WARM:    '#f97316',  // Orange
  COOL:    '#3b82f6',  // Blue
  NEUTRAL: '#94a3b8',  // Gray
  VIVID:   '#a855f7',  // Purple
  DARK:    '#334155',  // Dark slate
  SOFT:    '#f9a8d4',  // Pink
};
```

### 8-2. 차트 타입별 사용 가이드

| 차트 타입 | 사용 조건 | 예시 |
|---|---|---|
| **Line Chart** | 시계열 데이터 (3개 이상 지점), 추세 비교 | 기간별 업로드/가입/문의 추이 |
| **Bar Chart (세로)** | 카테고리별 비교 (6개 이하), 절대값 강조 | 요일별 업로드 수 |
| **Bar Chart (가로)** | 레이블이 긴 카테고리, 순위 | 촬영 종류별 문의 수 |
| **Pie/Donut** | 비율/구성 표시 (5개 이하), 전체 중 점유율 | 색채 무드 분포 |
| **Heatmap (Table)** | 2차원 데이터, 코호트 분석 | 월별 가입 코호트 유지율 |

**Line vs Bar 선택 기준**:
- 연속적 시간 흐름 → Line
- 독립적 카테고리 비교 → Bar
- 같은 데이터로 Bar와 Line 중 선택해야 한다면: 7일 이하 → Bar, 8일 이상 → Line

**Pie 사용 금지 케이스**:
- 6개 이상 슬라이스 (가독성 저하)
- 수치 차이가 작은 경우 (< 5% 차이)
- 절대값이 중요한 경우 → Bar 사용

### 8-3. 차트 공통 스타일

```javascript
// Recharts 공통 props (SVG이므로 CSS 변수 사용 불가 — 헥스 직접)
const CHART_STYLE = {
  cartesianGrid: {
    strokeDasharray: '3 3',
    stroke: '#f1f5f9',         // --color-border-light
    vertical: false,           // 세로 격자선 제거 (가독성)
  },
  xAxis: {
    tick: { fontSize: 11, fill: '#94a3b8' },  // --text-xs, text-tertiary
    axisLine: { stroke: '#e2e8f0' },
    tickLine: false,
  },
  yAxis: {
    tick: { fontSize: 11, fill: '#94a3b8' },
    axisLine: false,
    tickLine: false,
    width: 40,
  },
  tooltip: {
    contentStyle: {
      background: '#0f172a',
      border: '1px solid #1e293b',
      borderRadius: '8px',
      fontSize: '12px',
      color: '#e2e8f0',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    },
    labelStyle: { color: '#94a3b8', marginBottom: 4 },
    cursor: { fill: 'rgba(99, 102, 241, 0.05)' },  // brand-500 + alpha
  },
  legend: {
    wrapperStyle: { fontSize: '12px', color: '#475569', paddingTop: '8px' },
  },
};
```

### 8-4. 빈 데이터 상태, 로딩 상태 처리

**빈 데이터**:
```jsx
// 차트 데이터 없을 때
{data.length === 0 ? (
  <div className="chart-empty">
    <BarChart2 size={32} color="#94a3b8" />
    <p>데이터가 없습니다.</p>
  </div>
) : (
  <ResponsiveContainer>...</ResponsiveContainer>
)}
```

```css
.chart-empty {
  height: 240px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--color-text-tertiary);
  font-size: var(--text-sm);
}
```

**로딩 상태** (부분 로딩):
```css
.chart-loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-lg);
}
```

### 8-5. KPI 카드 디자인 스펙

```
┌──────────────────────────────────────────┐
│  [📷 아이콘 20px]                         │  아이콘 배경: color + 10% opacity
│                                          │  padding: 18px 20px
│  247                                     │  28px / 700 / tabular-nums
│  기간 내 사진 업로드                       │  13px / 400 / text-secondary
│  ↑ +32 전일 대비                          │  optional: 증감률 (success/danger color)
└──────────────────────────────────────────┘
  border-left: 4px solid [지표 색상]
  background: var(--color-surface)
  border-radius: var(--radius-lg)
  box-shadow: var(--shadow-sm)
```

**증감률 표시 기준**:
- 증가: `color: var(--color-success-text)`, `↑` + TrendingUp 아이콘
- 감소: `color: var(--color-danger-text)`, `↓` + TrendingDown 아이콘
- 중립(0): `color: var(--color-text-tertiary)`, `→`

---

## 9. 다크모드 디자인 스펙

### 9-1. 라이트/다크 토큰 대응표

```css
/* tokens.css에 추가 */
[data-theme="dark"] {
  /* Neutral */
  --color-bg:           #0f172a;   /* Slate 900 */
  --color-surface:      #1e293b;   /* Slate 800 */
  --color-surface-2:    #334155;   /* Slate 700 */
  --color-border:       #334155;
  --color-border-light: #1e293b;

  /* Text */
  --color-text-primary:   #f1f5f9;
  --color-text-secondary: #94a3b8;
  --color-text-tertiary:  #64748b;
  --color-text-muted:     #64748b;

  /* Semantic — bg만 어둡게 조정 */
  --color-success-bg: #052e16;
  --color-warning-bg: #1c1202;
  --color-danger-bg:  #1c0202;
  --color-info-bg:    #022020;

  /* 역할 Badge — bg 어둡게 */
  --color-role-wm-bg:   #2e1065;
  --color-role-sa-bg:   #0c1a4f;
  --color-role-us-bg:   #052e16;

  /* Overlay */
  --color-overlay:       rgba(0, 0, 0, 0.65);
  --color-overlay-light: rgba(0, 0, 0, 0.40);
}

/* 시스템 설정 따르기 */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    /* [data-theme="dark"]와 동일 */
  }
}
```

### 9-2. 다크모드 주의 케이스

| 케이스 | 라이트 | 다크 처리 |
|---|---|---|
| Sidebar | `#0f172a` | 변경 없음 (이미 어두움) — border는 `#334155`로 약간 밝게 |
| StatCard border-left 색상 | 유지 | 유지 (semantic 색상) |
| 테이블 unread-row 배경 | `#fffdf5` (따뜻한 노랑) | `#1c1202` (어두운 노랑) |
| Recharts 차트 GridLine | `#f1f5f9` | `#334155` — JS에서 조건부 처리 |
| Recharts Tooltip | 다크 (`#0f172a`) | 라이트 (`#f8fafc`) — 역전 |
| 이미지 placeholder | `#f1f5f9` 배경 | `#334155` 배경 |
| 인풋 focus ring | `#eef2ff` (brand-50) | `rgba(99,102,241,0.15)` |

**다크모드 Recharts 처리**:
```javascript
// ThemeContext에서 resolvedTheme 가져와 조건부 적용
const { resolvedTheme } = useTheme();
const isDark = resolvedTheme === 'dark';

<CartesianGrid stroke={isDark ? '#334155' : '#f1f5f9'} />
<Tooltip contentStyle={isDark
  ? { background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }
  : { background: '#0f172a', border: '1px solid #1e293b', color: '#e2e8f0' }
} />
```

### 9-3. Sidebar 다크모드 처리

Sidebar는 라이트/다크 모두 `#0f172a` 배경으로 고정. 단, 다크모드에서:
- `--color-sidebar-border`: `#334155` (약간 밝게, 구분선 가시성)
- `--color-sidebar-text`: `#64748b` → `#94a3b8` (가독성 향상)
- 나머지 색상 변경 없음

```css
[data-theme="dark"] {
  --color-sidebar-border: #334155;  /* 라이트와 동일, 콘텐츠 배경이 달라지므로 문제 없음 */
  /* sidebar-bg, sidebar-hover, sidebar-text: 유지 */
}
```

**테마 토글 위치**: 
- 데스크탑: Sidebar footer 하단 (로그아웃 버튼 위)
- 모바일: AdminHeader 우측

---

## 10. 구현 우선순위 & 컴포넌트 개발 순서

### 10-1. Atomic Design 기준 구현 순서

**Atom (기본 단위, 독립 구현 가능)**:
1. `Button` — primary/secondary/danger/ghost/link × sm/md/lg
2. `Input` — text/email/password + error state
3. `Textarea`
4. `Select` (필터용 — 이미 구현됨, 확장)
5. `Badge` — 역할/상태/무드 모든 variant
6. `Spinner`
7. `Skeleton`

**Molecule (Atom 조합)**:
8. `InputWithIcon` — 검색 인풋 래퍼
9. `FormField` — 레이블 + Input + 에러 메시지 묶음
10. `FilterBar` — 검색 + 다중 Select 조합
11. `PageHeader` — 타이틀 + 카운트 + 액션버튼 조합
12. `StatCard` — KPI 카드 (이미 구현됨, 스펙 맞게 개선)
13. `EmptyState` — 아이콘 + 메시지 + 선택적 버튼
14. `Pagination` — 이미 구현됨

**Organism (복잡한 UI 블록)**:
15. `DataTable` — thead/tbody + 정렬 + hover + 빈상태
16. `ConfirmDialog` — 이미 구현됨
17. `SlideOver` — 범용 슬라이드 패널 (Phase 10)
18. `FeaturedList` — 드래그 정렬 가능한 피처드 목록
19. `ChartCard` — 차트 + 헤더 + 로딩오버레이 래퍼
20. `NoticeEditor` — 공지 폼 (제목+내용+기간+상태)

**Template (페이지 레이아웃)**:
21. `AdminLayout` — 이미 구현됨, Phase 7 개선
22. `ListPageTemplate` — 헤더 + 필터바 + 테이블 + 페이지네이션

### 10-2. 기존 컴포넌트 개선 vs 신규 생성

**개선 (기존 파일 수정)**:
| 컴포넌트 | 개선 내용 | Phase |
|---|---|---|
| `Sidebar.css/jsx` | 접힘 기능, 미읽음 Badge, 신규 메뉴 추가 | Phase 10-A/B |
| `AdminLayout.css/jsx` | CSS 변수 sidebar-width, 반응형 | Phase 7, 10-A |
| `Pagination.jsx/css` | aria 속성, focus 스타일 | Phase 7 |
| `global.css` | sr-only, chart-empty, skeleton, spinner 유틸 추가 | 즉시 |
| `tokens.css` | 신규 토큰 추가 (Section 2-1 참고) | 즉시 |
| `StatsPage.jsx` | KPI 카드, 부분 로딩, CSV, 작가 퍼포먼스, 코호트 | Phase 8+ |
| `DashboardPage.jsx` | StatCard 증감률, 이모지→아이콘 마무리 | Phase 5 이후 |

**신규 생성**:
| 컴포넌트 | 경로 | Phase |
|---|---|---|
| `Button.jsx/css` | `components/common/` | P2 |
| `EmptyState.jsx/css` | `components/common/` | P2 |
| `SlideOver.jsx/css` | `components/common/` | Phase 10-C |
| `ContentPolicyPage.jsx/css` | `pages/` | P3 신규기능 |
| `ReportListPage.jsx/css` | `pages/` | P3 신규기능 |
| `NoticePage.jsx/css` | `pages/` | P3 신규기능 |
| `BannerPage.jsx/css` | `pages/` | P3 신규기능 |
| `TagPage.jsx/css` | `pages/` | P3 신규기능 |
| `ThemeContext.jsx` | `context/` | Phase 9 |

### 10-3. 각 컴포넌트 예상 구현 시간

| 컴포넌트 | 예상 시간 | 난이도 |
|---|---|---|
| Button (모든 variant/size) | 1.5h | 낮음 |
| Input + FormField | 1h | 낮음 |
| Badge (모든 variant) | 0.5h | 낮음 |
| Skeleton + Spinner | 0.5h | 낮음 |
| EmptyState | 0.5h | 낮음 |
| DataTable (정렬, sticky) | 2h | 중간 |
| SlideOver (범용) | 2h | 중간 |
| 회원 상세 SlideOver (콘텐츠) | 1.5h | 중간 |
| 문의 상세 SlideOver (콘텐츠) | 1h | 낮음 |
| 콘텐츠 정책 페이지 | 4h | 높음 |
| 신고 관리 페이지 | 3h | 중간 |
| 공지사항 페이지 (목록+에디터) | 3h | 중간 |
| 배너 관리 (드래그 포함) | 4h | 높음 |
| 태그/카테고리 관리 | 2h | 중간 |
| 고도화 통계 (작가+코호트) | 4h | 높음 |
| 다크모드 (ThemeContext + tokens) | 3h | 중간 |
| 반응형 레이아웃 (Phase 7) | 3h | 중간 |

**총 예상 시간**: ~36h (약 4.5 영업일)

---

*이 문서는 개발 진행에 따라 지속 업데이트됩니다. 구현 완료된 섹션은 해당 Phase 번호와 함께 체크해주세요.*

# 사진 · 포트폴리오 연관성 및 디자인 시스템 확장 기획서

> 작성일: 2026-06-21 (v1.0)
> 연관 문서: PHOTO_SEARCH_SPEC.md (v2.0)
> 대상 시스템: Happiness Admin + Happiness App (사용자 앱)

---

## 0. 개요 및 현황

### 현재 데이터 구조 관계도

```
Member (회원/사진작가)
  │
  ├─── Photo (사진)          1:N
  │      ├── title, description
  │      ├── colorMood (WARM/COOL/...)
  │      ├── likesCount / savesCount / sharesCount
  │      └── [예정] categoryCode (5차 분류)
  │
  └─── Series (시리즈)       1:N
         ├── title, description, coverImageUrl
         └── SeriesPhoto (N:M)
                └── photo_id + display_order
```

### 현재 시리즈(Series)의 한계

| 항목 | 현재 Series | 필요한 Portfolio |
|------|-------------|-----------------|
| 목적 | 사진 묶음 | 작가 브랜딩·작품 쇼케이스 |
| 공개 설정 | 없음 | 공개/비공개/일부공개 |
| 정렬/순서 | display_order만 | 섹션·챕터별 구성 |
| 카테고리 연결 | 없음 | 5차 분류 연동 |
| 통계 | 없음 | 조회수·좋아요·저장 집계 |
| 대표 이미지 | coverImageUrl 1장 | 대표 + 썸네일 갤러리 |
| 태그 | 없음 | 다중 태그 |
| 관리자 검수 | 없음 | 검수 상태 관리 |

### 개선 방향

기존 `Series`는 유지하되, 상위 개념으로 **Portfolio**를 도입:

```
Photo (원자 단위)
  └── 하나의 사진이 여러 Portfolio에 포함될 수 있음 (N:M)

Series (연작 단위)
  └── 특정 스토리·날짜·장소로 묶인 사진 묶음 (기존 유지)
  └── 하나의 Portfolio에 포함될 수 있음

Portfolio (포트폴리오 단위)
  └── 작가의 작품 세계관을 보여주는 큐레이션 쇼케이스
  └── Photo + Series를 섞어 구성 가능
  └── 5차 카테고리 분류 연동
  └── 검수·공개 상태 관리
```

---

## 1. 사진 · 시리즈 · 포트폴리오 연관 기획

### 1-1. 세 개념의 역할 정의

| 개념 | 한국어 | 단위 | 소유자 | 역할 |
|------|--------|------|--------|------|
| **Photo** | 사진 | 원자 | 작가 | 단독 작품. 모든 것의 최소 단위 |
| **Series** | 시리즈/연작 | 묶음 | 작가 | 같은 날·장소·주제로 촬영한 사진 그룹 |
| **Portfolio** | 포트폴리오 | 쇼케이스 | 작가 | 작가의 능력을 보여주기 위해 curate한 작품집 |

### 1-2. 연관 관계 모델 (ERD)

```
members ─────────────────────── 1:N ──── photos
    │                                       │
    │                                       │  N:M (portfolio_photos)
    │                                       ▼
    ├── 1:N ── series                  portfolios ──── portfolio_items
    │            │                         │             (photo_id OR series_id)
    │            └── N:M (series_photos)   │
    │                      ↓               │
    │                   photos             │
    │                                      │
    └── 1:N ──────────────────────────────┘
```

**portfolio_items 테이블** (Photo와 Series를 혼합 수용):

```sql
CREATE TABLE portfolio_items (
  id             BIGINT PRIMARY KEY AUTO_INCREMENT,
  portfolio_id   BIGINT NOT NULL REFERENCES portfolios(id),
  item_type      VARCHAR(10) NOT NULL,  -- 'PHOTO' | 'SERIES'
  photo_id       BIGINT REFERENCES photos(id),
  series_id      BIGINT REFERENCES series(id),
  display_order  INT DEFAULT 0,
  section_name   VARCHAR(50),           -- 섹션 구분 (e.g., "웨딩", "스냅")
  is_featured    BOOLEAN DEFAULT FALSE, -- 대표 작품 여부
  added_at       TIMESTAMP DEFAULT NOW()
);
```

### 1-3. Portfolio 엔티티 설계

```sql
CREATE TABLE portfolios (
  id               BIGINT PRIMARY KEY AUTO_INCREMENT,
  member_id        BIGINT NOT NULL REFERENCES members(id),
  title            VARCHAR(100) NOT NULL,
  subtitle         VARCHAR(200),
  description      TEXT,
  cover_image_url  VARCHAR(500),
  category_code    CHAR(10) DEFAULT '0000000000',  -- 5차 분류 연동
  tags             VARCHAR(500),                    -- 콤마 구분 태그
  status           VARCHAR(20) DEFAULT 'DRAFT',     -- DRAFT|PENDING|APPROVED|REJECTED
  visibility       VARCHAR(20) DEFAULT 'PRIVATE',   -- PRIVATE|PUBLIC|UNLISTED
  view_count       INT DEFAULT 0,
  likes_count      INT DEFAULT 0,
  saves_count      INT DEFAULT 0,
  is_pinned        BOOLEAN DEFAULT FALSE,            -- 작가 프로필 상단 고정
  admin_note       TEXT,                             -- 검수 메모
  reviewed_by      BIGINT REFERENCES members(id),   -- 검수 관리자
  reviewed_at      TIMESTAMP,
  published_at     TIMESTAMP,
  created_at       TIMESTAMP NOT NULL,
  updated_at       TIMESTAMP NOT NULL
);
```

### 1-4. 포트폴리오 상태 흐름 (Status Flow)

```
작가가 생성
     │
     ▼
  DRAFT ──── 작가가 제출 ────▶ PENDING (검수 대기)
     │                              │
     │                     관리자 검수
     │                    ┌────────┴────────┐
     │                    ▼                 ▼
     │               APPROVED           REJECTED
     │               (공개 가능)         (반려)
     │                    │                 │
     │               작가가 공개        수정 후 재제출
     │               visibility=PUBLIC       │
     │                                  DRAFT로 복귀
     │
     └──── 관리자가 직접 APPROVED 가능 (관리자 등록 포트폴리오)
```

**관리자 검수 액션:**

| 액션 | 조건 | 결과 |
|------|------|------|
| 승인 | status=PENDING | → APPROVED, reviewed_by, reviewed_at 기록 |
| 반려 | status=PENDING | → REJECTED, admin_note 필수 입력 |
| 강제 비공개 | status=APPROVED | → visibility=PRIVATE (신고·부적절 콘텐츠) |
| 재활성화 | status=REJECTED | → PENDING 복귀 허용 |

### 1-5. 사진 → 포트폴리오 역방향 참조

사진 상세 보기 시 "이 사진이 포함된 포트폴리오" 표시:

```
📷 봄의 기억
  ├── 포함된 시리즈: 봄날의 기록
  └── 포함된 포트폴리오: 웨딩 스타일 모음 (공개), 2026 스프링 컬렉션 (비공개)
```

**API:**
```
GET /api/admin/photos/{id}/portfolios   → 사진이 포함된 포트폴리오 목록
GET /api/admin/series/{id}/portfolios  → 시리즈가 포함된 포트폴리오 목록
```

### 1-6. 카테고리 코드 자동 상속 로직

포트폴리오 구성 시 포함된 사진들의 카테고리 코드를 분석해 포트폴리오 대표 코드 제안:

```java
// 포트폴리오 내 사진들의 카테고리 최빈값 → 대표 코드 제안
public String suggestCategoryCode(List<Photo> photos) {
    Map<String, Long> freq = photos.stream()
        .filter(p -> p.getCategoryCode() != null)
        .collect(groupingBy(p -> p.getCategoryCode().substring(0, 2), counting()));
    String dominantL1 = freq.entrySet().stream()
        .max(Map.Entry.comparingByValue())
        .map(Map.Entry::getKey).orElse("00");
    // 나머지 레벨도 동일하게 분석 후 조합
    return buildSuggestedCode(photos, dominantL1);
}
```

---

## 2. 포트폴리오 관리 페이지 기획

### 2-1. 관리자 포트폴리오 목록 (`/portfolios`)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 포트폴리오 관리                              총 142개                     │
│ ─────────────────────────────────────────────────────────────────────── │
│ [🔍 제목·작가 검색] [상태 ▾] [공개 ▾] [카테고리 ▾] [정렬 ▾]  [초기화]   │
│ 검수 대기: 8건  ← 빨간 뱃지 (즉각 주의)                                  │
└─────────────────────────────────────────────────────────────────────────┘

┌─────┬──────────────────────────┬──────────┬───────────┬────────┬───────┐
│커버 │ 제목 / 작가               │ 상태     │ 공개설정  │ 통계  │ 관리  │
├─────┼──────────────────────────┼──────────┼───────────┼────────┼───────┤
│[img]│ 웨딩 스타일 모음           │ ✅승인   │ 🌐 공개   │👁1.2K │[검수] │
│     │ @admin · 12장 · 2시리즈  │          │           │❤️234  │[숨김] │
├─────┼──────────────────────────┼──────────┼───────────┼────────┼───────┤
│[img]│ 2026 스프링 컬렉션        │ ⏳대기   │ 🔒 비공개 │👁0    │[승인] │
│     │ @user1 · 8장 · 1시리즈   │          │           │❤️0    │[반려] │
└─────┴──────────────────────────┴──────────┴───────────┴────────┴───────┘
```

### 2-2. 포트폴리오 상세 검수 패널 (SlideOver)

```
┌──────────────────────────────────────────┐
│  포트폴리오 검수                          │
│  ──────────────────────────────────────  │
│  [커버 이미지 대형]                       │
│                                          │
│  제목: 웨딩 스타일 모음                   │
│  부제: 2026년 봄/여름 웨딩 작품집         │
│  작가: 웹관리자 (@admin)                  │
│  카테고리: 웨딩 > 야외 > 웜 > 자연스러운  │
│  구분자: 0101010101                       │
│  태그: #웨딩 #야외 #봄 #내추럴            │
│                                          │
│  ── 포함 작품 (12장 + 2 시리즈) ────────  │
│  [썸1] [썸2] [썸3] [썸4] +8장 더보기     │
│  시리즈: [봄날의 기록] [골든아워]         │
│                                          │
│  ── 검수 의견 ───────────────────────────│
│  [                              ]        │
│  [  관리자 메모 (반려 시 필수)   ]        │
│  [                              ]        │
│                                          │
│  [강제 비공개]   [반려]   [승인 ✓]       │
└──────────────────────────────────────────┘
```

### 2-3. 포트폴리오 통계 집계

```
GET /api/admin/portfolios/stats
→ {
    total: 142,
    byStatus: { DRAFT: 45, PENDING: 8, APPROVED: 83, REJECTED: 6 },
    byVisibility: { PUBLIC: 65, PRIVATE: 71, UNLISTED: 6 },
    topPortfolios: [...],  // 조회수 Top 5
    recentSubmissions: [...]  // 최근 검수 요청 5건
  }
```

### 2-4. 사진·시리즈·포트폴리오 교차 탐색

관리자가 사진 상세에서 포트폴리오로, 포트폴리오에서 다시 포함된 사진으로 이동:

```
[사진: 봄의 기억]
  └── 포함 시리즈: 봄날의 기록 → [클릭] → 시리즈 상세
  └── 포함 포트폴리오: 웨딩 스타일 모음 → [클릭] → 포트폴리오 검수 패널

[포트폴리오: 웨딩 스타일 모음]
  └── 포함 사진 12장 → [클릭] → 사진 상세 패널
  └── 포함 시리즈 2개 → [클릭] → 시리즈 상세
```

**브레드크럼 네비게이션:**
```
사진 관리 > 봄의 기억 > 포트폴리오 > 웨딩 스타일 모음
```

---

## 3. 디자인 시스템 확장 계획

### 3-1. 설계 원칙

| 원칙 | 내용 |
|------|------|
| **토큰 우선** | 모든 색상·간격·타이포그래피는 CSS Custom Property로 추상화 |
| **컴포넌트 계층** | Atom → Molecule → Organism → Template → Page |
| **다크모드 대응** | `prefers-color-scheme` + 수동 전환 토글 |
| **반응형 우선** | 모바일 360px부터 설계, 데스크톱으로 확장 |
| **접근성** | WCAG 2.1 AA 기준. 모든 인터랙티브 요소 키보드 접근 가능 |
| **애니메이션 절제** | `prefers-reduced-motion` 대응, 의미 있는 전환만 사용 |

### 3-2. 토큰 시스템 확장 (tokens.css v2)

#### 색상 팔레트 확장

```css
:root {
  /* ── 브랜드 팔레트 (현재) ── */
  --color-brand-50:  #eef2ff;
  --color-brand-100: #e0e7ff;
  --color-brand-400: #818cf8;
  --color-brand-500: #6366f1;
  --color-brand-600: #4f46e5;
  --color-brand-700: #4338ca;

  /* ── 카테고리별 색상 (신규) ── */
  --color-cat-wedding:   #f9a8d4;  /* 1차 웨딩 - 핑크 */
  --color-cat-snap:      #86efac;  /* 1차 스냅 - 그린 */
  --color-cat-family:    #fbbf24;  /* 1차 가족 - 옐로 */
  --color-cat-graduate:  #60a5fa;  /* 1차 졸업 - 블루 */
  --color-cat-body:      #f97316;  /* 1차 바디 - 오렌지 */
  --color-cat-product:   #a78bfa;  /* 1차 제품 - 퍼플 */
  --color-cat-nature:    #34d399;  /* 1차 자연 - 에메랄드 */
  --color-cat-arch:      #94a3b8;  /* 1차 건축 - 슬레이트 */

  /* ── 무드별 색상 (신규) ── */
  --color-mood-warm:     #fcd34d;
  --color-mood-cool:     #7dd3fc;
  --color-mood-neutral:  #d1d5db;
  --color-mood-vivid:    #f472b6;
  --color-mood-dark:     #6b7280;
  --color-mood-soft:     #c4b5fd;
  --color-mood-mono:     #374151;
  --color-mood-film:     #d97706;

  /* ── 포트폴리오 상태 색상 (신규) ── */
  --color-status-draft:    #94a3b8;
  --color-status-pending:  #f59e0b;
  --color-status-approved: #22c55e;
  --color-status-rejected: #ef4444;

  /* ── 다크모드 오버라이드 (신규) ── */
  --color-bg-dark:           #0b1120;
  --color-surface-dark:      #131f35;
  --color-surface-2-dark:    #1a2845;
  --color-border-dark:       #1e3a5f;
  --color-text-primary-dark: #e2e8f0;

  /* ── 타이포그래피 확장 (신규) ── */
  --text-3xl:  36px;
  --text-hero: 48px;
  --line-tight:  1.25;
  --line-normal: 1.5;
  --line-loose:  1.75;
  --font-weight-regular: 400;
  --font-weight-medium:  500;
  --font-weight-semibold: 600;
  --font-weight-bold:    700;

  /* ── Z-index 레이어 (신규, 충돌 방지) ── */
  --z-base:      0;
  --z-raised:    10;
  --z-dropdown:  100;
  --z-sticky:    200;
  --z-overlay:   300;
  --z-modal:     400;
  --z-toast:     500;
  --z-tooltip:   600;

  /* ── 애니메이션 (신규) ── */
  --duration-fast:   100ms;
  --duration-normal: 200ms;
  --duration-slow:   350ms;
  --ease-default:    cubic-bezier(0.4, 0, 0.2, 1);
  --ease-spring:     cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-out:        cubic-bezier(0, 0, 0.2, 1);

  /* ── 그림자 확장 (신규) ── */
  --shadow-inset:  inset 0 2px 4px rgba(0,0,0,0.06);
  --shadow-focus:  0 0 0 3px rgba(99,102,241,0.25);
  --shadow-card:   0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
  --shadow-modal:  0 20px 60px rgba(0,0,0,0.3);
}

/* 다크모드 토큰 자동 전환 */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --color-bg:           var(--color-bg-dark);
    --color-surface:      var(--color-surface-dark);
    --color-surface-2:    var(--color-surface-2-dark);
    --color-border:       var(--color-border-dark);
    --color-text-primary: var(--color-text-primary-dark);
  }
}

[data-theme="dark"] {
  --color-bg:           var(--color-bg-dark);
  --color-surface:      var(--color-surface-dark);
  --color-surface-2:    var(--color-surface-2-dark);
  --color-border:       var(--color-border-dark);
  --color-text-primary: var(--color-text-primary-dark);
}
```

#### 반응형 브레이크포인트 토큰

```css
/* JavaScript에서 참조 가능하도록 :root에도 정의 */
:root {
  --bp-xs:  360px;   /* 소형 모바일 */
  --bp-sm:  640px;   /* 대형 모바일 */
  --bp-md:  768px;   /* 태블릿 */
  --bp-lg:  1024px;  /* 소형 데스크톱 */
  --bp-xl:  1280px;  /* 데스크톱 */
  --bp-2xl: 1536px;  /* 대형 모니터 */
}
```

### 3-3. 컴포넌트 계층 구조

```
Atom (단위 요소, 재사용 불가 분리)
  ├── Button (Primary, Secondary, Ghost, Danger, Icon)
  ├── Badge (카테고리, 상태, 무드, 숫자)
  ├── Input (Text, Search, Date, Textarea)
  ├── Select (단일, 다중)
  ├── Checkbox / Radio
  ├── Avatar (사용자 프로필 이미지)
  ├── Skeleton (로딩 플레이스홀더)
  └── Icon (Lucide React 래퍼)

Molecule (Atom 조합)
  ├── SearchBar (Input + Icon + 초기화 버튼)
  ├── FilterSelect (Select + 레이블)
  ├── SortBuilder (정렬 기준 빌더 – 다중)
  ├── CategoryCascade (1~5차 드롭다운 연계)
  ├── CategoryBadge (코드 디코딩 → 레이블)
  ├── StatusBadge (DRAFT·PENDING·APPROVED 등)
  ├── PhotoCard (이미지 + 메타 + 액션)
  ├── PortfolioCard (커버 + 통계 + 상태)
  ├── ActionBar (벌크 선택 시 하단 플로팅)
  └── Pagination (현재 구현 완료)

Organism (Molecule 조합, 도메인 로직 포함)
  ├── FilterBar (검색 + 필터 + 정렬 + 결과수)
  ├── PhotoGrid (그리드 레이아웃 + 빈 상태)
  ├── PhotoTable (리스트 뷰 테이블)
  ├── PortfolioList (포트폴리오 테이블)
  ├── CategoryTree (트리 사이드패널)
  ├── SlideOver (상세 패널 – 우측 슬라이드)
  ├── BulkCategoryModal (일괄 분류 모달)
  ├── ConfirmDialog (현재 구현 완료)
  └── DataTable (범용 테이블 – 정렬·페이지)

Template (레이아웃)
  ├── AdminLayout (사이드바 + 콘텐츠)
  ├── AdminHeader (모바일 헤더)
  ├── DetailLayout (목록 + 사이드패널 분할)
  └── EmptyState (빈 결과 레이아웃)

Page
  ├── DashboardPage
  ├── PhotoListPage
  ├── PortfolioListPage  ← 신규
  ├── SeriesListPage
  ├── MemberListPage
  ├── InquiryListPage
  ├── StatsPage
  └── SystemPage
```

### 3-4. Button 컴포넌트 스펙

```
┌──── Primary ────┐  ┌──── Secondary ───┐  ┌──── Ghost ───┐  ┌─ Danger ─┐
│  [버튼 텍스트]  │  │  [버튼 텍스트]   │  │ [버튼 텍스트]│  │  [삭제]  │
└─────────────────┘  └──────────────────┘  └──────────────┘  └──────────┘
   brand-500 배경       border + 텍스트       배경 없음           danger 배경

크기 변형:
  sm: padding 6px 12px,  font 12px, radius 6px
  md: padding 9px 18px,  font 14px, radius 8px  (기본)
  lg: padding 12px 24px, font 15px, radius 10px

상태:
  default  → hover (10% 밝기 변화) → active (5% 어둡게) → focus (shadow-focus) → disabled (opacity 0.4)
```

```css
/* Button 기반 CSS (global.css 확장) */
.btn {
  display: inline-flex; align-items: center; gap: 6px;
  font-family: var(--font-sans); font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-md); cursor: pointer;
  transition: all var(--duration-normal) var(--ease-default);
  white-space: nowrap; user-select: none;
}
.btn:focus-visible { outline: none; box-shadow: var(--shadow-focus); }
.btn:disabled { opacity: 0.4; cursor: not-allowed; pointer-events: none; }

.btn-md { padding: 9px 18px; font-size: var(--text-base); }
.btn-sm { padding: 6px 12px; font-size: var(--text-xs); border-radius: var(--radius-sm); }
.btn-lg { padding: 12px 24px; font-size: var(--text-md); border-radius: var(--radius-lg); }

.btn-primary { background: var(--color-brand-500); color: white; border: none; }
.btn-primary:hover { background: var(--color-brand-600); }
.btn-primary:active { background: var(--color-brand-700); }

.btn-secondary {
  background: transparent; color: var(--color-brand-500);
  border: 1.5px solid var(--color-brand-400);
}
.btn-secondary:hover { background: var(--color-brand-50); }

.btn-ghost {
  background: transparent; color: var(--color-text-secondary);
  border: 1.5px solid var(--color-border);
}
.btn-ghost:hover { background: var(--color-surface-2); color: var(--color-text-primary); }

.btn-danger { background: var(--color-danger-bg); color: var(--color-danger); border: 1px solid #fecaca; }
.btn-danger:hover { background: var(--color-danger); color: white; border-color: var(--color-danger); }
```

### 3-5. Badge 컴포넌트 스펙

```css
/* 상태 뱃지 */
.badge-status-draft    { background: #f1f5f9; color: var(--color-status-draft); }
.badge-status-pending  { background: var(--color-warning-bg); color: var(--color-status-pending); }
.badge-status-approved { background: var(--color-success-bg); color: var(--color-status-approved); }
.badge-status-rejected { background: var(--color-danger-bg);  color: var(--color-status-rejected); }

/* 카테고리 레벨 뱃지 */
.badge-cat-l1 { background: #fdf2f8; color: #be185d; }  /* 1차 - 핑크 */
.badge-cat-l2 { background: #f0fdf4; color: #15803d; }  /* 2차 - 그린 */
.badge-cat-l3 { background: #eff6ff; color: #1d4ed8; }  /* 3차 - 블루 */
.badge-cat-l4 { background: #faf5ff; color: #7e22ce; }  /* 4차 - 퍼플 */
.badge-cat-l5 { background: #fff7ed; color: #c2410c; }  /* 5차 - 오렌지 */

/* 무드 뱃지 */
.badge-mood-warm    { background: #fef9c3; color: #a16207; }
.badge-mood-cool    { background: #e0f2fe; color: #0369a1; }
.badge-mood-neutral { background: #f3f4f6; color: #4b5563; }
.badge-mood-vivid   { background: #fdf2f8; color: #be185d; }
.badge-mood-dark    { background: #1f2937; color: #d1d5db; }
.badge-mood-soft    { background: #f5f3ff; color: #6d28d9; }
```

### 3-6. Card 컴포넌트 스펙

#### PhotoCard (그리드 뷰)

```
┌────────────────┐
│                │  ← aspect-ratio: 4/3 (기본) / 1:1 (정방) / 16:9 (와이드)
│   [이미지]     │  ← object-fit: cover
│                │
│ [무드 뱃지] [카테고리 뱃지]  ← 우상단 오버레이
│                │
│ [선택 체크박스] ← hover 시 좌상단 표시 (벌크 모드)
└────────────────┘
  [분류 구분자]    ← 구분코드 (호버 시 디코딩 툴팁)
  제목             ← Highlight 컴포넌트 적용
  @작가명
  ❤️ 10 · 🔖 5 · 🔄 2
  2026-01-15 · [삭제] [분류]
```

**3가지 크기 변형:**

| 크기 | 컬럼 | 용도 |
|------|------|------|
| `sm` | 6열 (≥1400px), 4열 (기본) | 고밀도 탐색 |
| `md` | 4열 (기본), 3열 (태블릿) | 기본 |
| `lg` | 2열 | 상세 확인 중심 |

#### PortfolioCard (목록 뷰)

```
┌──────┬───────────────────────────────────────────────┬────────────┐
│[커버]│ 웨딩 스타일 모음                               │ [승인] btn │
│      │ 웹관리자 (@admin) · 12장 · 2시리즈             │ [숨김] btn │
│      │ 카테고리: 웨딩 > 야외 > 웜                     │            │
│      │ ✅ APPROVED  🌐 공개  👁1.2K ❤️234            │            │
└──────┴───────────────────────────────────────────────┴────────────┘
```

### 3-7. SlideOver 컴포넌트 (범용 상세 패널)

우측에서 슬라이드 인 되는 상세 패널. 사진 상세, 포트폴리오 검수, 카테고리 지정에 공통 사용.

```
화면 전체
┌──────────────────────────────┬──────────────────┐
│                              │  SlideOver        │
│   목록 (dimmed overlay)      │  ───────────────  │
│                              │  [제목]     [×]   │
│                              │                   │
│                              │  [콘텐츠 영역]    │
│                              │                   │
│                              │  [하단 액션바]    │
└──────────────────────────────┴──────────────────┘
                               ← 480px (기본) / 640px (상세)
```

```css
.slideover-backdrop {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: var(--z-overlay);
  animation: fadeIn var(--duration-normal) var(--ease-out);
}
.slideover {
  position: fixed; top: 0; right: 0; bottom: 0;
  width: min(480px, 100vw);
  background: var(--color-surface);
  box-shadow: var(--shadow-modal);
  z-index: var(--z-modal);
  display: flex; flex-direction: column;
  animation: slideInRight var(--duration-slow) var(--ease-spring);
}
.slideover-header { padding: 20px 24px; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; }
.slideover-body   { flex: 1; overflow-y: auto; padding: 24px; }
.slideover-footer { padding: 16px 24px; border-top: 1px solid var(--color-border); display: flex; gap: 10px; justify-content: flex-end; }

@keyframes slideInRight {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .slideover { animation: none; }
  .slideover-backdrop { animation: none; }
}
```

### 3-8. DataTable 범용 컴포넌트 스펙

현재 각 페이지마다 `<table className="data-table">` 중복. 범용화:

```jsx
// 제안하는 DataTable 인터페이스
<DataTable
  columns={[
    { key: 'title', label: '제목', sortable: true, render: (v, row) => <Highlight text={v} keyword={search} /> },
    { key: 'authorName', label: '작가', sortable: true },
    { key: 'status', label: '상태', render: (v) => <StatusBadge status={v} /> },
    { key: 'createdAt', label: '등록일', sortable: true, render: (v) => v?.slice(0,10) },
    { key: '_actions', label: '관리', render: (_, row) => <ActionButtons row={row} /> },
  ]}
  data={data.content}
  loading={loading}
  sortBy={sortBy}
  onSort={handleSort}
  selectable
  selectedIds={selectedIds}
  onSelectChange={setSelectedIds}
  emptyMessage="포트폴리오가 없습니다."
/>
```

### 3-9. FilterBar 범용 컴포넌트 스펙

```jsx
<FilterBar
  search={{ value: search, onChange: setSearch, placeholder: "제목·작가 검색" }}
  filters={[
    { key: 'status', label: '상태', options: STATUS_OPTIONS },
    { key: 'visibility', label: '공개', options: VISIBILITY_OPTIONS },
    { key: 'l1', label: '카테고리', type: 'category-cascade', levels: 5 },
  ]}
  sort={{
    value: sortOrders,
    onChange: setSortOrders,
    keys: SORT_KEY_OPTIONS,
    multi: true,      // 복합 정렬
    preset: true,     // 프리셋 저장
  }}
  params={searchParams}
  onParamsChange={setSearchParams}   // URL 동기화
  totalCount={data.totalElements}
  onReset={handleReset}
/>
```

### 3-10. 애니메이션 & 트랜지션 가이드라인

| 패턴 | duration | easing | 용도 |
|------|----------|--------|------|
| 버튼 hover | 100ms | ease-default | 배경색, 텍스트색 |
| 드롭다운 열기 | 150ms | ease-out | opacity + translateY(-4px) |
| SlideOver 열기 | 350ms | ease-spring | translateX(100%)→0 |
| 모달 등장 | 200ms | ease-out | opacity + scale(0.96)→1 |
| 토스트 등장 | 200ms | ease-spring | translateY(16px)→0 |
| 스켈레톤 shimmer | 1.5s | linear | 반복 gradient 이동 |
| 페이지 전환 | 없음 | — | 플리커 방지를 위해 미사용 |

```css
/* Skeleton shimmer */
.skeleton {
  background: linear-gradient(90deg, var(--color-surface-2) 25%, var(--color-border) 50%, var(--color-surface-2) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
}
@keyframes shimmer {
  from { background-position: 200% center; }
  to   { background-position: -200% center; }
}
@media (prefers-reduced-motion: reduce) {
  .skeleton { animation: none; background: var(--color-surface-2); }
}
```

### 3-11. 다크모드 구현 계획

**전환 방식:** 수동 토글 (시스템 설정 + 수동 오버라이드)

```jsx
// ThemeContext.jsx
const ThemeContext = createContext();
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('admin_theme') || 'system'
  );
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.setAttribute('data-theme', 'dark');
    else if (theme === 'light') root.setAttribute('data-theme', 'light');
    else root.removeAttribute('data-theme');  // system: CSS media query 처리
    localStorage.setItem('admin_theme', theme);
  }, [theme]);
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
};
```

**사이드바 하단에 토글 추가:**
```
사이드바 하단
  ─────────────────────
  [☀ 라이트] [시스템] [🌙 다크]
  웹관리자 (@admin)
```

### 3-12. 타이포그래피 계층

```
Display (Hero)   48px / 700 / tight  → 랜딩, 대형 수치
Heading 1        28px / 700 / tight  → 페이지 제목 (page-title)
Heading 2        22px / 700 / tight  → 카드 섹션 제목 (card-title)
Heading 3        18px / 600 / normal → 소섹션 제목
Body Large       15px / 400 / normal → 설명문
Body             14px / 400 / normal → 기본 본문 (text-base)
Body Small       13px / 400 / normal → 보조 텍스트 (text-sm)
Caption          11px / 400 / normal → 날짜, 통계 등 (text-xs)
Code             13px / Mono         → 확인 구분자, 코드 표시
```

```css
/* 구분자 코드 전용 스타일 */
.code-badge {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: var(--text-xs);
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 2px 8px;
  letter-spacing: 0.1em;
  color: var(--color-text-secondary);
}
/* 확인 구분자 hover 시 레벨별 색상 표시 */
.code-badge:hover .code-l1 { color: #be185d; }
.code-badge:hover .code-l2 { color: #15803d; }
.code-badge:hover .code-l3 { color: #1d4ed8; }
.code-badge:hover .code-l4 { color: #7e22ce; }
.code-badge:hover .code-l5 { color: #c2410c; }
```

---

## 4. 페이지별 디자인 개편 계획

### 4-1. 대시보드 (DashboardPage) 확장

현재 stat 카드 4개 → 포트폴리오 지표 추가:

```
┌───────────┬───────────┬───────────┬───────────┬───────────┬───────────┐
│  👥 회원  │  📷 사진  │  🗂 포폴  │  📬 문의  │  🔔 미읽 │  ⏳검수대기│
│   1,234   │  30,542   │   142     │    15     │    8      │    8      │
│ +12 오늘  │ +45 오늘  │ +3 신규   │ 오늘 신규 │ 미읽음    │ 즉시처리  │
└───────────┴───────────┴───────────┴───────────┴───────────┴───────────┘
```

대시보드에 **포트폴리오 검수 알림 패널** 추가:

```
⏳ 검수 대기 8건
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[커버] 2026 스프링 컬렉션 · @user1 · 2026-06-21  [검수하기 →]
[커버] 가을 감성 모음       · @user3 · 2026-06-20  [검수하기 →]
 ⋮
```

### 4-2. 사진 관리 페이지 (PhotoListPage) 개편

```
┌─────────────────────────────────────────────────────────────────────────┐
│  사진 관리                                    총 30,542장               │
│  ─────────────────────────────────────────────────────────────────────  │
│  [🔍 검색...] [1차▾] [2차▾] [3차▾] [4차▾] [5차▾]  [정렬▾] [⊞ ≡]      │
│  검색 결과: 142장                               [초기화] [CSV↓] [🏷분류]  │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  ☐ [카드] ☐ [카드] ☐ [카드] ☐ [카드]   ← 그리드 (기본)               │
│  ...                                                                    │
│                                                                         │
│  ━━━━━ 하단 액션바 (체크 시 표시) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  5장 선택  [선택 해제] [일괄 분류 🏷] [일괄 삭제 🗑] [CSV 내보내기 📥]   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4-3. 포트폴리오 관리 페이지 (신규 `/portfolios`)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  포트폴리오 관리                              총 142개                    │
│  ─────────────────────────────────────────────────────────────────────  │
│  [🔍 검색...] [상태▾] [공개▾] [카테고리▾] [정렬▾]  [초기화]             │
│  ⚠️ 검수 대기: 8건 ── [바로 확인]                                        │
│  ─────────────────────────────────────────────────────────────────────  │
│  [포트폴리오 카드 목록 또는 테이블 토글]                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4-4. 시리즈 관리 페이지 (SeriesListPage) 개편

현재: 단순 테이블. 개편 방향:
- 포트폴리오 연결 현황 표시 ("포함된 포트폴리오 없음 / 2개에 포함")
- 시리즈 → 포트폴리오 추가 버튼

---

## 5. 사용자 앱(happiness-app) 연동 고려사항

### 5-1. 관리자 → 앱 데이터 흐름

```
관리자 (Admin)                    사용자 앱 (happiness-app)
─────────────────────────────────────────────────────────
카테고리 코드 분류 ──────────────▶ 카테고리별 탐색 피드
포트폴리오 검수·승인 ────────────▶ 작가 프로필 포트폴리오 노출
키워드 태그 관리 ────────────────▶ 태그 검색 기능
무드 분류 관리 ──────────────────▶ 무드별 피드/추천
사진 숨김/삭제 ──────────────────▶ 실시간 미노출 처리 (soft delete)
```

### 5-2. 포트폴리오 공개 URL 구조

```
happiness-app.com/p/@admin/portfolio/1                → 포트폴리오 상세
happiness-app.com/p/@admin/portfolio/1?cat=0101       → 카테고리 필터 진입
happiness-app.com/p/@admin                            → 작가 프로필 (포트폴리오 목록)
```

### 5-3. 관리자 권한별 접근 제어

| 권한 | 포트폴리오 | 사진 분류 | 카테고리 마스터 |
|------|-----------|----------|----------------|
| SA (슈퍼관리자) | 전체 CRUD | 전체 | 생성/수정/삭제 |
| WM (웹관리자) | 검수·승인·반려 | 분류 지정 | 조회만 |
| 작가 (US) | 자신의 포트폴리오만 | — | 조회만 |

---

## 6. 구현 로드맵

### 단계별 계획

```
Phase A — 포트폴리오 기반 구축 (3~4일)
  [ ] Portfolio 엔티티 + DB 마이그레이션
  [ ] PortfolioItem 엔티티 (Photo/Series 혼합)
  [ ] Portfolio CRUD API (목록·상세·검수)
  [ ] 포트폴리오 목록 페이지 (React)
  [ ] 포트폴리오 검수 SlideOver

Phase B — 연관성 탐색 (2일)
  [ ] GET /photos/{id}/portfolios
  [ ] GET /series/{id}/portfolios
  [ ] 사진 상세에서 포트폴리오 역참조 표시
  [ ] 브레드크럼 네비게이션 컴포넌트

Phase C — 디자인 시스템 (3~4일)
  [ ] tokens.css v2 (색상·z-index·애니메이션 토큰 추가)
  [ ] Button 컴포넌트 통합 (btn-*) - global.css 확장
  [ ] Badge 컴포넌트 (상태·카테고리·무드)
  [ ] SlideOver 컴포넌트 (범용)
  [ ] Skeleton 컴포넌트
  [ ] DataTable 범용화 리팩토링
  [ ] 다크모드 ThemeContext + 토글 UI

Phase D — 고급 기능 (4~5일)
  [ ] 포트폴리오 검수 워크플로우 (PENDING→APPROVED/REJECTED)
  [ ] 일괄 분류 BulkCategoryModal
  [ ] 카테고리 트리 사이드패널
  [ ] 복합 정렬 SortBuilder
  [ ] 대시보드 포트폴리오 지표 카드 추가

장기 계획
  [ ] FilterBar 범용 컴포넌트화
  [ ] Storybook 컴포넌트 문서화
  [ ] 다크모드 전체 페이지 적용
  [ ] 앱 연동 포트폴리오 공개 URL
  [ ] AI 카테고리 자동 분류 제안
```

---

## 7. 기술 결정 사항

| 항목 | 결정 | 이유 |
|------|------|------|
| 포트폴리오 엔티티 | 신규 테이블 (Series와 별도) | Series는 단순 묶음, Portfolio는 프레젠테이션 레이어 |
| portfolio_items 다형성 | `item_type` + `photo_id`/`series_id` nullable | JPA 상속보다 단순, 쿼리 직관적 |
| 다크모드 구현 | CSS `data-theme` + media query fallback | 런타임 JS 없이 CSS만으로 전환 가능 |
| SlideOver vs Modal | SlideOver 우선 | 목록 문맥 유지, 작업 중단감 최소화 |
| 범용 DataTable | 점진적 리팩토링 (기존 테이블 유지하며 교체) | 빅뱅 리팩토링 위험 방지 |
| 애니메이션 | CSS only (`@keyframes`) | JS 라이브러리 의존 없음, Framer 불필요 |
| 토큰 변수명 | `--color-*`, `--text-*`, `--z-*` 등 그룹 접두사 | 충돌 방지, IntelliSense 자동완성 활용 |

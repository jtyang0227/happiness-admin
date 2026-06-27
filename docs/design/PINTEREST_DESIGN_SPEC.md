# Happiness Admin — Pinterest-Concept Design Specification

> **컨셉**: Pinterest의 핀(Pin) 기반 콘텐츠 탐색 경험을 어드민 대시보드에 적용한다.
> 이미지가 주인공이고, 그리드가 살아 숨쉬며, 작업은 카드 위에서 바로 이루어진다.

---

## 1. 디자인 철학

### 1.1 핵심 원칙

| 원칙 | 설명 | Pinterest에서 배운 것 |
|------|------|----------------------|
| **Content First** | UI 크롬을 최소화하고 콘텐츠(이미지)를 전면에 | 네비게이션이 방해하지 않는다 |
| **Card Everything** | 모든 정보 단위는 카드(Pin)다 | 작은 카드, 큰 이미지, 짧은 텍스트 |
| **Action on Hover** | 액션 버튼은 호버 시만 노출 | 평소엔 콘텐츠만, 필요할 때만 UI |
| **Masonry Grid** | 이미지 비율을 죽이지 않는 워터폴 레이아웃 | 높이가 다른 카드가 자연스럽게 쌓인다 |
| **Warm & Inviting** | 차갑지 않은 따뜻한 중립 톤 배경 | 흰색보다 약간 따뜻한 크림/베이지 |

### 1.2 Pinterest vs 기존 어드민 비교

```
기존 어드민                        Pinterest 컨셉 어드민
─────────────────────────────────────────────────────────
고정 높이 테이블/그리드              → 가변 높이 메이슨리 그리드
액션 버튼 항상 노출                  → 카드 호버 시만 오버레이
흰 배경 + 회색 패널                  → 크림/웜 뉴트럴 + 핀 레드 포인트
사이드바 항상 표시                   → 슬림 아이콘 레일 + 툴팁
상태 뱃지 테이블 내 텍스트           → 컬러 도트 + 카드 코너 라벨
페이지네이션                         → Load More / 무한 스크롤
```

---

## 2. Color System

### 2.1 팔레트

```css
/* ── Pinterest Core ── */
--pin-red:       #E60023;   /* Pinterest 시그니처 레드 — CTA, 포인트 */
--pin-red-dark:  #AD081B;   /* 호버, 액티브 */
--pin-red-light: #FFEBEE;   /* 배경 강조, 뱃지 배경 */

/* ── Warm Neutrals (배경/서피스) ── */
--warm-50:   #FAFAF8;   /* 페이지 배경 — 차갑지 않은 크림 */
--warm-100:  #F5F5F0;   /* 카드 배경 */
--warm-200:  #EDECEA;   /* 구분선, 호버 배경 */
--warm-300:  #D9D8D4;   /* 비활성 보더 */
--warm-400:  #B0AFA9;   /* 플레이스홀더 */
--warm-500:  #76756E;   /* 보조 텍스트 */
--warm-600:  #4A4944;   /* 본문 텍스트 */
--warm-900:  #111110;   /* 제목, 강조 텍스트 */

/* ── Semantic ── */
--color-bg:          var(--warm-50);
--color-surface:     #FFFFFF;
--color-surface-2:   var(--warm-100);
--color-surface-3:   var(--warm-200);
--color-border:      var(--warm-300);
--color-border-light: var(--warm-200);
--color-text-primary:   var(--warm-900);
--color-text-secondary: var(--warm-600);
--color-text-tertiary:  var(--warm-500);
--color-brand-500:  var(--pin-red);
--color-brand-600:  var(--pin-red-dark);
--color-brand-50:   var(--pin-red-light);

/* ── Status ── */
--color-success:    #00875A;
--color-success-bg: #E3FCEF;
--color-warning:    #FF8B00;
--color-warning-bg: #FFFAE6;
--color-danger:     #DE350B;
--color-danger-bg:  #FFEBE6;
--color-info:       #0065FF;
--color-info-bg:    #DEEBFF;
```

### 2.2 다크 모드

```css
[data-theme="dark"] {
  --color-bg:           #1A1A1A;
  --color-surface:      #242424;
  --color-surface-2:    #2E2E2E;
  --color-surface-3:    #383838;
  --color-border:       #3D3D3D;
  --color-border-light: #333333;
  --color-text-primary:   #EBEBEB;
  --color-text-secondary: #A8A8A8;
  --color-text-tertiary:  #6B6B6B;
  --pin-red:       #FF3D57;  /* 다크모드에서 더 밝게 */
  --pin-red-dark:  #E60023;
  --pin-red-light: #3D1218;
}
```

---

## 3. Typography

### 3.1 폰트 스택

```css
/* 한글 + 라틴 혼용 최적화 */
--font-sans: 'Pretendard Variable', 'Pretendard', -apple-system,
             BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;

/* Pinterest는 둥근 서체를 쓴다 — Pretendard가 가장 가깝다 */
```

### 3.2 타입 스케일

```css
--text-xs:   11px;   /* 카드 날짜, 코드 뱃지 */
--text-sm:   13px;   /* 카드 부제목, 테이블 셀 */
--text-base: 14px;   /* 기본 UI 텍스트 */
--text-md:   15px;   /* 카드 제목 */
--text-lg:   18px;   /* 섹션 제목 */
--text-xl:   22px;   /* 페이지 제목 */
--text-2xl:  28px;   /* 대시보드 숫자 */
--text-3xl:  36px;   /* 히어로 숫자 */

--fw-regular:  400;
--fw-medium:   500;
--fw-semibold: 600;
--fw-bold:     700;
--fw-extrabold: 800;

--lh-tight:  1.2;
--lh-snug:   1.35;
--lh-normal: 1.5;
--lh-relaxed: 1.65;
```

---

## 4. Spacing & Radius

```css
/* 4px 베이스 시스템 */
--space-1:  4px;
--space-2:  8px;
--space-3:  12px;
--space-4:  16px;
--space-5:  20px;
--space-6:  24px;
--space-8:  32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;

/* Pinterest는 매우 둥글다 */
--radius-sm:  8px;
--radius-md:  12px;
--radius-lg:  16px;
--radius-xl:  24px;
--radius-full: 9999px;  /* 필 뱃지, 아바타 */
```

---

## 5. Shadows

```css
/* Pinterest 카드는 미묘한 그림자로 떠있는 느낌 */
--shadow-pin:    0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06);
--shadow-pin-hover: 0 4px 16px rgba(0,0,0,0.14), 0 8px 32px rgba(0,0,0,0.08);
--shadow-sm:     0 1px 2px rgba(0,0,0,0.06);
--shadow-md:     0 4px 12px rgba(0,0,0,0.10);
--shadow-lg:     0 8px 32px rgba(0,0,0,0.14);
--shadow-modal:  0 20px 60px rgba(0,0,0,0.20);
--shadow-focus:  0 0 0 3px rgba(230,0,35,0.20);  /* 핀 레드 포커스 링 */
```

---

## 6. Animation & Motion

```css
/* Pinterest는 빠르고 자연스러운 전환 */
--dur-fast:    120ms;
--dur-normal:  200ms;
--dur-slow:    320ms;
--dur-spring:  400ms;

--ease-default: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out:     cubic-bezier(0.0, 0, 0.2, 1);
--ease-spring:  cubic-bezier(0.34, 1.56, 0.64, 1);  /* 약간의 바운스 */
--ease-in-out:  cubic-bezier(0.4, 0, 0.6, 1);
```

---

## 7. Z-Index Layers

```css
--z-base:     0;
--z-raised:   10;
--z-sticky:   100;   /* 사이드바 레일 */
--z-overlay:  400;   /* 드롭다운, 툴팁 */
--z-modal:    500;   /* SlideOver, 다이얼로그 */
--z-toast:    600;   /* 토스트 알림 */
```

---

## 8. Layout — Pinterest Masonry Grid

### 8.1 메이슨리 원칙

Pinterest의 가장 강력한 시각 언어는 **컬럼 기반 워터폴(Masonry)** 레이아웃이다.
이미지를 정사각형으로 자르지 않고 원본 비율을 유지한 채 컬럼에 쌓는다.

```
┌──────────────────────────────────────────────────────────────┐
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐              │
│ │      │ │      │ │      │ │      │ │      │              │
│ │      │ │      │ │      │ │  img │ │      │              │
│ │  img │ │  img │ │      │ │(4:3) │ │  img │              │
│ │(2:3) │ │(1:1) │ │  img │ └──────┘ │(16:9)│              │
│ │      │ └──────┘ │(3:4) │ ┌──────┐ └──────┘              │
│ └──────┘ ┌──────┐ │      │ │      │ ┌──────┐              │
│ ┌──────┐ │      │ └──────┘ │  img │ │      │              │
│ │      │ │  img │          │(1:1) │ │  img │              │
│ └──────┘ └──────┘          └──────┘ └──────┘              │
└──────────────────────────────────────────────────────────────┘
  col 1     col 2     col 3     col 4     col 5
```

### 8.2 컬럼 수 반응형

| 뷰포트 | 컬럼 수 | 갭 |
|--------|---------|-----|
| < 640px (모바일) | 2 | 8px |
| 640–1023px (태블릿) | 3 | 12px |
| 1024–1399px (데스크톱) | 4 | 16px |
| ≥ 1400px (와이드) | 5–6 | 16px |

### 8.3 CSS 구현 (column-count 방식)

```css
.masonry-grid {
  column-count: 4;
  column-gap: 16px;
}

.masonry-grid .pin-card {
  break-inside: avoid;
  margin-bottom: 16px;
}

/* 이미지 비율을 유지 — 높이를 auto로 */
.pin-img {
  width: 100%;
  height: auto;
  display: block;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  background: var(--warm-200);
}

@media (max-width: 639px)  { .masonry-grid { column-count: 2; column-gap: 8px; } }
@media (min-width: 640px)  { .masonry-grid { column-count: 3; column-gap: 12px; } }
@media (min-width: 1024px) { .masonry-grid { column-count: 4; column-gap: 16px; } }
@media (min-width: 1400px) { .masonry-grid { column-count: 5; column-gap: 16px; } }
```

---

## 9. 핵심 컴포넌트

### 9.1 Pin Card (사진 카드)

Pinterest의 핀 카드는 3가지 상태를 가진다:

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│                     │    │ ┌─────────────────┐  │    │ ┌─────────────────┐  │
│                     │    │ │  [저장] [더보기] │  │    │ │  [저장] [더보기] │  │
│       이미지        │    │ └─────────────────┘  │    │ └─────────────────┘  │
│    (원본 비율)      │    │                       │    │                       │
│                     │    │       이미지          │    │       이미지          │
│                     │    │    (dim overlay)      │    │    (dim overlay)      │
└─────────────────────┘    │                       │    │                       │
│ 제목                │    └─────────────────────┘    └─────────────────────┘
│ @작가 · 날짜        │    │ 제목                │    │ 제목                │
│ ❤ 12               │    │ @작가 · 날짜        │    │ @작가 · 날짜        │
└─────────────────────┘    │ ❤ 12               │    │ 무드뱃지 카테고리   │
     기본 상태              └─────────────────────┘    └─────────────────────┘
                               호버 상태                  선택/포커스 상태
```

**카드 CSS 구조**

```css
.pin-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-pin);
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow var(--dur-normal) var(--ease-out),
              transform var(--dur-normal) var(--ease-out);
  position: relative;
}

.pin-card:hover {
  box-shadow: var(--shadow-pin-hover);
  transform: translateY(-2px);
}

/* 이미지 래퍼 — 호버 액션 오버레이 포함 */
.pin-img-wrap { position: relative; overflow: hidden; }

/* 호버 시 어두워지는 딤 레이어 */
.pin-dim {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0);
  transition: background var(--dur-normal) var(--ease-out);
}
.pin-card:hover .pin-dim { background: rgba(0,0,0,0.25); }

/* 호버 액션 버튼들 */
.pin-actions {
  position: absolute; top: 12px; right: 12px;
  display: flex; flex-direction: column; gap: 8px;
  opacity: 0; transform: translateY(-8px);
  transition: opacity var(--dur-normal) var(--ease-out),
              transform var(--dur-normal) var(--ease-spring);
}
.pin-card:hover .pin-actions {
  opacity: 1; transform: translateY(0);
}

/* 카드 하단 정보 영역 */
.pin-body {
  padding: 10px 12px 12px;
}

.pin-title {
  font-size: var(--text-md);
  font-weight: var(--fw-semibold);
  color: var(--color-text-primary);
  line-height: var(--lh-snug);
  margin-bottom: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.pin-author {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  margin-bottom: 6px;
}

.pin-foot {
  display: flex; align-items: center;
  justify-content: space-between;
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}
```

**호버 액션 버튼 스타일**

```css
/* 핀 저장 버튼 — Pinterest의 Save 버튼처럼 레드 */
.btn-pin-save {
  background: var(--pin-red);
  color: #fff;
  border: none;
  border-radius: var(--radius-full);
  padding: 8px 16px;
  font-size: var(--text-sm);
  font-weight: var(--fw-bold);
  cursor: pointer;
  box-shadow: var(--shadow-md);
  transition: background var(--dur-fast);
  white-space: nowrap;
}
.btn-pin-save:hover { background: var(--pin-red-dark); }

/* 더보기(⋯) 원형 버튼 */
.btn-pin-more {
  width: 36px; height: 36px;
  background: var(--color-surface);
  border: none; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; box-shadow: var(--shadow-md);
  color: var(--color-text-primary);
  transition: background var(--dur-fast);
}
.btn-pin-more:hover { background: var(--warm-200); }
```

---

### 9.2 Board Card (포트폴리오 보드)

Pinterest의 보드(Board) 개념을 포트폴리오에 적용:

```
┌─────────────────────────────┐
│ ┌─────┐ ┌───┐ ┌───┐        │   ← 커버 이미지 3분할
│ │     │ │   │ │   │        │
│ │     │ │   │ │   │        │
│ │  메인  │ 서브1│ 서브2│       │
│ │     │ │   │ │   │        │
│ └─────┘ └───┘ └───┘        │
│─────────────────────────────│
│  📁 웨딩 스냅 시리즈         │   ← 포트폴리오 제목
│  @photographer · 사진 24장  │   ← 메타
│  [PENDING 심사중] ✎ 수정    │   ← 상태 + 액션
└─────────────────────────────┘
```

```css
.board-card {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-pin);
  cursor: pointer;
  transition: box-shadow var(--dur-normal), transform var(--dur-normal);
}
.board-card:hover {
  box-shadow: var(--shadow-pin-hover);
  transform: translateY(-2px);
}

/* 3분할 커버 */
.board-cover {
  display: grid;
  grid-template-columns: 2fr 1fr;
  grid-template-rows: 1fr 1fr;
  height: 180px;
  gap: 2px;
  background: var(--warm-200);
}
.board-cover-main { grid-row: 1 / 3; }
.board-cover img { width: 100%; height: 100%; object-fit: cover; }

.board-body { padding: 14px 16px; }
.board-title {
  font-size: var(--text-md); font-weight: var(--fw-bold);
  color: var(--color-text-primary); margin-bottom: 4px;
}
.board-meta { font-size: var(--text-sm); color: var(--color-text-tertiary); }
```

---

### 9.3 Navigation — Icon Rail

Pinterest의 사이드바는 아이콘 레일 + 툴팁 구조:

```
┌────┐
│ 🔥 │  ← 로고 (Happiness)
├────┤
│ 🏠 │  대시보드         ← 아이콘만 표시 (기본)
│ 👥 │  회원
│ 📷 │  사진  ← 활성
│ 📁 │  포트폴리오
│ 📚 │  시리즈
│ 💬 │  문의
│ 📊 │  통계
│ ⚙️ │  시스템
├────┤
│ 🌙 │  다크모드 토글
│ 👤 │  내 계정
└────┘

호버 시:
┌────┬─────────────┐
│ 📷 │  사진 관리  │  ← 툴팁/레이블 슬라이드인
└────┴─────────────┘
```

```css
/* 아이콘 레일 */
.sidebar-rail {
  width: 68px;
  min-height: 100vh;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  display: flex; flex-direction: column; align-items: center;
  padding: 16px 0; gap: 4px;
  position: fixed; left: 0; top: 0; bottom: 0;
  z-index: var(--z-sticky);
}

.rail-item {
  position: relative;
  width: 44px; height: 44px;
  border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center;
  color: var(--color-text-tertiary);
  cursor: pointer; border: none; background: none;
  transition: background var(--dur-fast), color var(--dur-fast);
}
.rail-item:hover { background: var(--warm-200); color: var(--color-text-primary); }
.rail-item.active { background: var(--pin-red-light); color: var(--pin-red); }

/* 툴팁 레이블 */
.rail-item::after {
  content: attr(data-label);
  position: absolute; left: calc(100% + 12px);
  background: var(--warm-900); color: #fff;
  font-size: var(--text-sm); font-weight: var(--fw-medium);
  padding: 6px 10px; border-radius: var(--radius-sm);
  white-space: nowrap; pointer-events: none;
  opacity: 0; transform: translateX(-4px);
  transition: opacity var(--dur-fast), transform var(--dur-fast);
  z-index: var(--z-overlay);
}
.rail-item:hover::after { opacity: 1; transform: translateX(0); }

/* 활성 인디케이터 도트 */
.rail-item.active::before {
  content: '';
  position: absolute; left: -1px;
  width: 3px; height: 20px;
  background: var(--pin-red);
  border-radius: 0 2px 2px 0;
}

/* 메인 콘텐츠 오프셋 */
.main-content { margin-left: 68px; }
```

---

### 9.4 Search Bar — Pinterest Style

```
┌──────────────────────────────────────────────────────────────┐
│  🔍  제목, 작가, 설명으로 검색하세요                          │
└──────────────────────────────────────────────────────────────┘
```

```css
.pin-search {
  width: 100%;
  max-width: 600px;
  padding: 12px 20px 12px 44px;
  border: 2px solid transparent;
  border-radius: var(--radius-full);
  background: var(--warm-200);
  font-size: var(--text-base);
  color: var(--color-text-primary);
  outline: none;
  transition: background var(--dur-normal), border-color var(--dur-normal),
              box-shadow var(--dur-normal);
}
.pin-search:focus {
  background: var(--color-surface);
  border-color: var(--pin-red);
  box-shadow: var(--shadow-focus);
}
/* 검색 아이콘 래퍼 */
.pin-search-wrap {
  position: relative; display: inline-block; width: 100%; max-width: 600px;
}
.pin-search-wrap .search-icon {
  position: absolute; left: 16px; top: 50%; transform: translateY(-50%);
  color: var(--warm-400); pointer-events: none;
}
```

---

### 9.5 Filter Pills

Pinterest의 카테고리 필터는 알약(Pill) 형태:

```
[전체] [웨딩] [스냅] [가족] [졸업] [펫] [기업] …
```

```css
.pill-bar { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }

.pill {
  padding: 8px 16px;
  background: var(--color-surface);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: var(--text-sm); font-weight: var(--fw-medium);
  color: var(--color-text-secondary);
  cursor: pointer; white-space: nowrap;
  transition: all var(--dur-fast);
}
.pill:hover { border-color: var(--warm-600); color: var(--color-text-primary); }
.pill.active {
  background: var(--warm-900); border-color: var(--warm-900);
  color: #fff;
}
.pill-red.active {
  background: var(--pin-red); border-color: var(--pin-red); color: #fff;
}
```

---

### 9.6 Status Badge — Dot Style

테이블 내 텍스트 뱃지 대신 컬러 도트 + 라벨:

```css
.status-dot {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: var(--text-sm); font-weight: var(--fw-medium);
}
.status-dot::before {
  content: '';
  width: 8px; height: 8px;
  border-radius: 50%; flex-shrink: 0;
}
.status-dot.pending::before  { background: var(--color-warning); box-shadow: 0 0 0 3px var(--color-warning-bg); }
.status-dot.approved::before { background: var(--color-success); box-shadow: 0 0 0 3px var(--color-success-bg); }
.status-dot.rejected::before { background: var(--color-danger);  box-shadow: 0 0 0 3px var(--color-danger-bg); }
.status-dot.draft::before    { background: var(--warm-400);      box-shadow: 0 0 0 3px var(--warm-200); }
```

---

### 9.7 SlideOver / Detail Panel

카드 클릭 시 오른쪽에서 슬라이드인하는 Pinterest의 핀 상세 패널:

```
┌─────────────────────────────────────────┐
│                          [X]            │
│ ┌─────────────────────────────────────┐ │
│ │                                     │ │
│ │           이미지 (원본비율)          │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ 봄의 기억                               │
│ @photographer                           │
│ ────────────────────────────────────── │
│ WARM  |  01 웨딩 · 02 실내 · 03 소프트 │
│ ────────────────────────────────────── │
│ ❤ 142  🔖 38  🔄 12                   │
│ 2026.03.15 업로드                       │
│ ────────────────────────────────────── │
│ 확인 구분자                             │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
│ │  01  │ │  02  │ │  03  │ │  04  │  │
│ │ 웨딩 │ │ 실내 │ │소프트│ │모던  │  │
│ └──────┘ └──────┘ └──────┘ └──────┘  │
│ ────────────────────────────────────── │
│              [삭제]  [코드 저장]        │
└─────────────────────────────────────────┘
```

---

### 9.8 Dashboard — Stat Cards

Pinterest 스타일 통계 카드:

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ 📷              │  │ 👥              │  │ ❤              │  │ ⏳              │
│                 │  │                 │  │                 │  │                 │
│    1,284        │  │      342        │  │   28,491        │  │      18         │
│    사진         │  │     회원        │  │   좋아요        │  │  심사 대기      │
│ +12 오늘        │  │ +3 오늘         │  │ +892 이번 주    │  │ PENDING         │
└─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘
```

```css
.stat-pin {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  padding: 24px;
  box-shadow: var(--shadow-pin);
  display: flex; flex-direction: column; gap: 12px;
  transition: box-shadow var(--dur-normal), transform var(--dur-normal);
}
.stat-pin:hover {
  box-shadow: var(--shadow-pin-hover);
  transform: translateY(-2px);
}
.stat-icon { font-size: 24px; }
.stat-number {
  font-size: var(--text-3xl); font-weight: var(--fw-extrabold);
  color: var(--color-text-primary); line-height: 1;
}
.stat-label { font-size: var(--text-sm); color: var(--color-text-tertiary); }
.stat-delta { font-size: var(--text-xs); color: var(--color-success); font-weight: var(--fw-semibold); }
```

---

## 10. 페이지별 레이아웃

### 10.1 사진 관리 페이지 — Pin Grid

```
┌─────────────────────────────────────────────────────────────┐
│  사진 관리                                    총 1,284장    │
├─────────────────────────────────────────────────────────────┤
│  🔍 [검색창                                              ]  │
│  [전체] [웨딩] [스냅] [가족] [졸업] [펫]  [WARM▼] [최신▼] │
├─────────────────────────────────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐            │
│  │      │ │      │ │      │ │      │ │      │            │
│  │      │ │      │ │      │ │      │ │      │            │
│  │ Pin  │ │ Pin  │ │ Pin  │ │ Pin  │ │ Pin  │            │
│  │      │ │      │ │      │ │      │ └──────┘            │
│  └──────┘ │      │ │      │ └──────┘ ┌──────┐            │
│  ┌──────┐ └──────┘ └──────┘ ┌──────┐ │      │            │
│  │      │ ┌──────┐ ┌──────┐ │      │ │      │            │
│  │ Pin  │ │      │ │ Pin  │ │ Pin  │ └──────┘            │
│  └──────┘ │ Pin  │ └──────┘ └──────┘                     │
│           └──────┘                                         │
│                      [더 불러오기]                         │
└─────────────────────────────────────────────────────────────┘
     column-count: 5   (≥ 1400px)
```

### 10.2 포트폴리오 관리 — Board Grid

```
┌──────────────────────────────────────────────────────────────┐
│  포트폴리오                                       총 42개    │
├──────────────────────────────────────────────────────────────┤
│  [전체 6] [임시 1] [심사중 2] [승인 2] [반려 1]             │
│  🔍 [검색]                           [공개▼] [최신▼]        │
├──────────────────────────────────────────────────────────────┤
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │ ▓▓ │ ░ │ ░ │ │ ▓▓ │ ░ │ ░ │ │ ▓▓ │ ░ │ ░ │         │
│  │ ▓▓ │ ░ │ ░ │ │ ▓▓ │ ░ │ ░ │ │ ▓▓ │ ░ │ ░ │         │
│  ├───────────────┤ ├───────────────┤ ├───────────────┤        │
│  │ 📁 봄의 포트 │ │ 📁 스냅 모음 │ │ 📁 도시 스냅 │        │
│  │ @user1 · 12장│ │ @user2 · 8장 │ │ @user3 ·24장 │        │
│  │ [승인] 📌    │ │ [심사중]      │ │ [승인]        │        │
│  └──────────────┘ └──────────────┘ └──────────────┘         │
└──────────────────────────────────────────────────────────────┘
```

### 10.3 대시보드 — Pinterest Home

```
┌──────────────────────────────────────────────────────────────┐
│  오늘의 요약          2026년 6월 23일 월요일                  │
├─────────┬────────────┬─────────────┬──────────────┐          │
│  1,284  │    342     │   28,491    │     18       │          │
│  사진   │    회원    │   좋아요    │  심사 대기   │          │
└─────────┴────────────┴─────────────┴──────────────┘          │
│                                                              │
│  최근 업로드                          최근 7일 활동          │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌──────────────────┐  │
│  │    │ │    │ │    │ │    │ │    │ │    Bar Chart     │  │
│  └────┘ └────┘ └────┘ └────┘ └────┘ └──────────────────┘  │
│                                                              │
│  심사 대기 중 포트폴리오  [모두 보기→]                       │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │   Board 카드 │ │   Board 카드 │ │   Board 카드 │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
└──────────────────────────────────────────────────────────────┘
```

---

## 11. 인터랙션 패턴

### 11.1 카드 호버 시퀀스

```
0ms     카드에 마우스 진입
0ms     transform: translateY(-2px) 시작 (200ms)
0ms     box-shadow 증가 시작 (200ms)
50ms    dim 레이어 어두워짐 시작 (200ms)
80ms    액션 버튼 opacity 0→1, translateY -8px→0 (200ms ease-spring)
```

### 11.2 SlideOver 오픈

```
0ms     backdrop fade-in 시작 (200ms)
0ms     패널 translateX(100%)→translateX(0) 시작 (350ms ease-spring)
350ms   패널 완전히 오픈, 내용 포커스 가능
```

### 11.3 이미지 로딩 — Pinterest Skeleton

```
[로딩 중]                    [로드 완료]
┌──────────────┐             ┌──────────────┐
│▓▓▓▓▓▓▓▓▓▓▓▓│  shimmer    │              │
│▓▓▓▓▓▓▓▓▓▓▓▓│  →→→→→     │    이미지    │
│▓▓▓▓▓▓▓▓▓▓▓▓│             │    fade-in   │
└──────────────┘             └──────────────┘
```

```css
/* 이미지 점진적 로딩 */
.pin-img {
  opacity: 0;
  transition: opacity var(--dur-slow) var(--ease-out);
}
.pin-img.loaded { opacity: 1; }

/* Skeleton */
.pin-skeleton {
  background: linear-gradient(
    90deg, var(--warm-200) 25%, var(--warm-300) 50%, var(--warm-200) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer {
  from { background-position: 200% center; }
  to   { background-position: -200% center; }
}
```

---

## 12. 카테고리 코드 시각화

10자리 확인 구분자를 Pinterest의 태그 클라우드처럼 표시:

```
확인 구분자: 0101020305

┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ 01       │  │ 01       │  │ 02       │  │ 03       │  │ 05       │
│ 웨딩     │  │ 실내     │  │ 쿨톤     │  │ 모던     │  │ 드레스업 │
│ 1차 종류 │  │ 2차 환경 │  │ 3차 무드 │  │ 4차 스타 │  │ 5차 세부 │
└──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘
  #fdf2f8       #f0fdf4       #eff6ff       #faf5ff       #fff7ed
  #be185d       #15803d       #1d4ed8       #7e22ce       #c2410c
```

---

## 13. 폰트 로딩 전략

```html
<!-- Pretendard CDN (한글 지원) -->
<link rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable.css" />
```

```css
/* 폰트 미로딩 시 폴백 체인 */
--font-sans: 'Pretendard Variable', 'Pretendard',
             -apple-system, BlinkMacSystemFont,
             'Apple SD Gothic Neo', 'Noto Sans KR',
             sans-serif;
```

---

## 14. 구현 우선순위 로드맵

### Phase 1 — 토큰 & 기반 (1–2일)
- [ ] `tokens.css` — Pinterest 색상/그림자/반경/애니메이션 토큰 적용
- [ ] `global.css` — 버튼 시스템, 필 뱃지, 상태 도트 스타일
- [ ] Pretendard 폰트 적용
- [ ] 아이콘 레일 Sidebar 교체

### Phase 2 — Pin Grid (2–3일)
- [ ] `PhotoListPage.jsx` — column-count masonry 그리드
- [ ] `.pin-card` — 호버 오버레이 + 액션 버튼
- [ ] 이미지 lazy-load + fade-in + skeleton
- [ ] Filter Pills 컴포넌트

### Phase 3 — Board Grid (1–2일)
- [ ] `PortfolioListPage.jsx` — 보드 카드 3분할 커버
- [ ] 상태 stat 카드 (도트 + 숫자)
- [ ] SlideOver 리뷰 패널 Pinterest 스타일 적용

### Phase 4 — 대시보드 리디자인 (1일)
- [ ] Stat Pin 카드 4종
- [ ] 최근 사진 미니 핀 그리드
- [ ] 심사 대기 보드 섹션

### Phase 5 — 다크모드 & 폴리싱 (1일)
- [ ] `[data-theme="dark"]` 전체 적용
- [ ] 시스템 다크모드 미디어쿼리 자동 감지
- [ ] 반응형 완성 (2컬럼 모바일)
- [ ] `prefers-reduced-motion` 대응

---

## 15. 디자인 체크리스트

### 카드 (Pin)
- [ ] 이미지 원본 비율 유지 (aspect-ratio: auto, height: auto)
- [ ] 호버 시 Y축 -2px 이동 + 그림자 증가
- [ ] 호버 시 딤 레이어 + 액션 버튼 출현
- [ ] 이미지 로드 전 skeleton shimmer
- [ ] 이미지 로드 완료 시 fade-in

### 그리드
- [ ] column-count masonry (break-inside: avoid)
- [ ] 반응형 2/3/4/5컬럼
- [ ] 갭 8–16px (뷰포트별)

### 네비게이션
- [ ] 68px 아이콘 레일 고정 사이드바
- [ ] 활성 아이템 핀 레드 배경 + 왼쪽 도트 인디케이터
- [ ] 호버 툴팁 레이블 슬라이드인

### 색상
- [ ] 배경: `#FAFAF8` (warm-50, 크림)
- [ ] 브랜드: `#E60023` (Pinterest Red)
- [ ] 텍스트: `#111110` (warm-900)
- [ ] 서피스: `#FFFFFF` + `#F5F5F0`

### 타이포
- [ ] Pretendard Variable 적용 확인
- [ ] 한글 자간 `-0.01em` 적용
- [ ] 카드 제목 2줄 ellipsis

---

*Happiness Admin Pinterest Design Spec v1.0*
*작성일: 2026-06-23*

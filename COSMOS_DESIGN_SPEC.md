# Happiness Admin — Cosmos 앱 레퍼런스 디자인 기획서

> **레퍼런스**: Cosmos 앱 (iOS, 다크 테마 큐레이션 앱)
> **적용 방향**: Cosmos의 다크 컨텐츠 우선 미학 + Pinterest 메이슨리 그리드 결합
> **작성일**: 2026-06-23

---

## 1. Cosmos 앱 UI 분석

### 1.1 스크린샷 분석 (IMG_7416.png)

```
┌──────────────────────────────────┐
│  9:01  ✦ COSMOS          LTE 48 │  ← 상태바 white on black
├──────────────────────────────────┤
│  🔍 Try 'scandinavian furniture' │  ← pill search, placeholder italic
│                               ·:·│    우측 dot-pattern (filter 아이콘)
├──────────────────────────────────┤
│  Featured  Shop  Graphic Design  │  ← 수평 탭 (underline indicator)
│  ──────                          │    active = white underline, 2px
├──────────────────────────────────┤
│ ┌───┐ ┌──┐                       │  ← 콜라주 이미지 그룹 (gap: 2px)
│ │   │ │  │ ┌──────────────────┐ │
│ │   │ ├──┤ │                  │ │
│ │   │ │  │ │   (close-up)     │ │
│ └───┘ └──┘ └──────────────────┘ │
│ ┌──────────┐  ┌───────────────┐  │  ← Board Card (3-preview 썸네일)
│ │ [3 imgs] │  │  [3 imgs]     │  │
│ │          │  │               │  │
│ summer     │  │ Museum Minimal│  │
│ @cgh ✓ 537 │  │ @lela ✓       │  │
│ └──────────┘  └───────────────┘  │
├──────────────────────────────────┤
│ ┌─────────────┐ ┌──────────────┐ │  ← Masonry 2-col (large items)
│ │             │ │              │ │
│ │  [B&W 사진] │ │  [풍경]      │ │
│ │  (tall)     │ ├──────────────┤ │
│ │             │ │  [폭포]      │ │
│ ├─────────────┤ └──────────────┘ │
│ │  [red img]  │                  │
│ └─────────────┘                  │
├──────────────────────────────────┤
│     🏠        🔍        👤       │  ← Bottom Tab Bar (3 icons)
└──────────────────────────────────┘
```

### 1.2 핵심 디자인 DNA

| 요소 | Cosmos 스펙 | 어드민 적용 방향 |
|------|------------|----------------|
| **배경** | Pure black `#000000` | `#0A0A0A` (AMOLED 최적화) |
| **서피스** | `#111111` ~ `#1A1A1A` | 카드/패널 배경 |
| **텍스트** | White `#FFFFFF` + Gray `#888` | 주/보조/3차 텍스트 |
| **이미지 갭** | 2px — 거의 없음 | 콜라주 영역 2px, 그리드 8px |
| **탭 인디케이터** | White underline 2px | 활성 탭 white underline |
| **검색바** | Pill shape, dark fill | 다크 pill, italic placeholder |
| **Board 카드** | 3-preview 썸네일 + 메타 | 포트폴리오 카드 동일 구조 |
| **인증 뱃지** | `✓` (체크마크, small) | 작가 인증 표시 |
| **하단 네비** | 3 icon bottom tab | 반응형 mobile bottom nav |
| **앱 이름** | COSMOS 중앙 정렬, tracked | HAPPINESS ADMIN |

---

## 2. 통합 디자인 시스템 (Cosmos × Pinterest)

두 레퍼런스의 장점을 결합한 **Happiness Admin 고유 디자인 언어**:

```
Cosmos    →  다크 테마 우선, 콜라주 그리드, 컨텐츠 중심, 미니멀 크롬
Pinterest →  메이슨리 레이아웃, 카드 호버 액션, 따뜻한 중립 (라이트 모드)
결합      →  라이트/다크 모드 모두 완성도 동일, 이미지가 주인공
```

---

## 3. Color System — 다크/라이트 완성

### 3.1 다크 모드 (Cosmos 레퍼런스)

```css
/* ── Dark Base (Cosmos DNA) ── */
--dark-bg:          #000000;   /* Pure black — AMOLED */
--dark-surface-1:   #111111;   /* 카드 1단계 */
--dark-surface-2:   #1A1A1A;   /* 카드 2단계, 입력 배경 */
--dark-surface-3:   #242424;   /* 호버, 선택 */
--dark-border:      #2A2A2A;   /* 미묘한 구분선 */
--dark-border-mid:  #3D3D3D;   /* 구분선 중간 */

/* ── Dark Text ── */
--dark-text-primary:   #FFFFFF;
--dark-text-secondary: #A0A0A0;
--dark-text-tertiary:  #606060;
--dark-text-muted:     #404040;

/* ── Accent (공통) ── */
--cosmos-accent:    #FFFFFF;   /* 다크모드 액센트 = 흰색 */
--pin-red:          #E60023;   /* CTA, 위험 액션 */
--pin-red-dark:     #AD081B;

/* ── Semantic (다크) ── */
--dark-success:     #22C55E;
--dark-warning:     #F59E0B;
--dark-danger:      #EF4444;
--dark-info:        #3B82F6;
```

### 3.2 라이트 모드 (Pinterest 레퍼런스)

```css
/* ── Light Base (Pinterest DNA) ── */
--light-bg:          #FAFAF8;   /* 웜 크림 */
--light-surface-1:   #FFFFFF;
--light-surface-2:   #F5F5F0;
--light-surface-3:   #EDECEA;
--light-border:      #D9D8D4;
--light-border-mid:  #E8E8E4;

/* ── Light Text ── */
--light-text-primary:   #111110;
--light-text-secondary: #4A4944;
--light-text-tertiary:  #76756E;

/* ── Accent (공통) ── */
--pin-red:       #E60023;
--pin-red-light: #FFEBEE;
```

### 3.3 CSS 변수 단일 인터페이스 (테마 자동 전환)

```css
/* 기본: 라이트 */
:root {
  --color-bg:           var(--light-bg);
  --color-surface:      var(--light-surface-1);
  --color-surface-2:    var(--light-surface-2);
  --color-surface-3:    var(--light-surface-3);
  --color-border:       var(--light-border);
  --color-text-primary: var(--light-text-primary);
  --color-text-secondary: var(--light-text-secondary);
  --color-text-tertiary:  var(--light-text-tertiary);
  --color-brand:        var(--pin-red);
}

/* 다크 모드 — 시스템 설정 자동 */
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg:           var(--dark-bg);
    --color-surface:      var(--dark-surface-1);
    --color-surface-2:    var(--dark-surface-2);
    --color-surface-3:    var(--dark-surface-3);
    --color-border:       var(--dark-border);
    --color-text-primary: var(--dark-text-primary);
    --color-text-secondary: var(--dark-text-secondary);
    --color-text-tertiary:  var(--dark-text-tertiary);
    --color-brand:        var(--cosmos-accent);  /* 다크에서 accent = white */
  }
}

/* 수동 다크 토글 */
[data-theme="dark"] { /* 위 다크 값 동일 적용 */ }
[data-theme="light"] { /* 위 라이트 값 강제 적용 */ }
```

---

## 4. Typography — Cosmos 스타일

```css
/* Cosmos는 tracked san-serif 앱 이름이 특징 */
--font-display: 'PP Neue Montreal', 'Helvetica Neue', 'Pretendard Variable', sans-serif;
--font-sans:    'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
--font-mono:    'JetBrains Mono', 'Fira Code', monospace;

/* 앱 타이틀 스타일 */
.app-title {
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.25em;   /* Cosmos의 tracked 스타일 */
  text-transform: uppercase;
  color: var(--color-text-primary);
}

/* 타입 스케일 */
--text-2xs: 10px;
--text-xs:  11px;
--text-sm:  13px;
--text-base: 14px;
--text-md:  15px;
--text-lg:  18px;
--text-xl:  22px;
--text-2xl: 28px;
--text-3xl: 36px;
```

---

## 5. 컴포넌트 상세 스펙

### 5.1 Top Navigation Bar (Cosmos 스타일)

```
┌──────────────────────────────────────────┐
│ ←  [◦◦] HAPPINESS ADMIN  [≡] [👤]       │  라이트 모드
│ ←  [◦◦] HAPPINESS ADMIN  [≡] [👤]       │  다크 모드 (흰 텍스트)
└──────────────────────────────────────────┘
```

```css
.cosmos-topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 20px; height: 52px;
  background: var(--color-bg);
  /* Cosmos처럼 보더 없이 배경만 */
  position: sticky; top: 0; z-index: var(--z-sticky);
}
.cosmos-topbar-title {
  font-size: 14px; font-weight: 600;
  letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--color-text-primary);
  position: absolute; left: 50%; transform: translateX(-50%);
}
.cosmos-topbar-icon {
  width: 36px; height: 36px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: var(--color-text-primary);
  background: transparent;
  transition: background var(--dur-fast);
}
.cosmos-topbar-icon:hover { background: var(--color-surface-2); }
```

### 5.2 Cosmos Search Bar

```
┌─────────────────────────────────────────────────────┐
│  🔍  Try '웨딩 스냅 작가'                       ·:· │
└─────────────────────────────────────────────────────┘
```

```css
.cosmos-search {
  width: 100%; padding: 10px 16px 10px 40px;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: 999px;   /* Full pill */
  font-size: var(--text-base);
  font-style: italic;     /* Cosmos 특유의 이탤릭 플레이스홀더 */
  color: var(--color-text-primary);
  outline: none;
  transition: border-color var(--dur-normal), background var(--dur-normal);
}
.cosmos-search:focus {
  background: var(--color-surface);
  border-color: var(--color-text-primary);  /* 다크: white border on focus */
  font-style: normal;
}
.cosmos-search::placeholder {
  font-style: italic;
  color: var(--color-text-tertiary);
}

/* 우측 dot-pattern 필터 아이콘 */
.cosmos-search-filter {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  color: var(--color-text-tertiary); font-size: 16px; cursor: pointer;
}
```

### 5.3 Category Tab Bar (Cosmos 스타일 — underline)

```
Featured  Shop  Graphic Design  Art  Fashion  ···
────                                           (좌측 활성 탭 underline)
```

```css
.cosmos-tabs {
  display: flex; gap: 0; overflow-x: auto; scrollbar-width: none;
  border-bottom: 1px solid var(--color-border);
  padding: 0 20px;
}
.cosmos-tabs::-webkit-scrollbar { display: none; }

.cosmos-tab {
  padding: 10px 16px; white-space: nowrap;
  font-size: var(--text-sm); font-weight: var(--fw-medium);
  color: var(--color-text-tertiary);
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;  /* border overlap */
  cursor: pointer;
  transition: color var(--dur-fast), border-color var(--dur-fast);
}
.cosmos-tab:hover { color: var(--color-text-primary); }
.cosmos-tab.active {
  color: var(--color-text-primary);
  border-bottom-color: var(--color-text-primary);  /* 다크: white, 라이트: black */
  font-weight: var(--fw-semibold);
}
```

### 5.4 Cosmos Collage Grid (이미지 콜라주 — 상단 히어로)

페이지 상단에 Pinterest 단순 그리드 대신 Cosmos 스타일 콜라주 영역을 배치:

```
┌────────────┬──────┬───────────────────────┐
│            │  ①  │                       │
│     ①      ├──────┤          ②           │
│  (tall)    │  ②  │     (portrait)        │
│            │      │                       │
└────────────┴──────┴───────────────────────┘
  gap: 2px — 거의 없음, 이미지들이 서로 맞닿아 있음
```

```css
/* Cosmos 히어로 콜라주 */
.cosmos-collage {
  display: grid;
  grid-template-columns: 2fr 1fr 2fr;
  grid-template-rows: auto;
  gap: 2px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--color-border);  /* 갭 색상 */
}
.cosmos-collage-main { grid-row: span 2; }
.cosmos-collage-sub  { aspect-ratio: 1; }
.cosmos-collage img  { width: 100%; height: 100%; object-fit: cover; display: block; }
```

### 5.5 Board / Collection Card (Cosmos + Pinterest 융합)

Cosmos의 3-preview 썸네일 보드 카드:

```
┌─────────────────────────────────────┐
│  ┌──────────┐  ┌────┐              │
│  │          │  │    │  ← 3 preview │
│  │  main    │  ├────┤  썸네일      │
│  │          │  │    │              │
│  └──────────┘  └────┘              │
├─────────────────────────────────────┤
│  웨딩 봄 컬렉션                     │  ← 제목 bold white
│  @photographer ✓ · 24장            │  ← 메타 gray
└─────────────────────────────────────┘
```

```css
.board-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: transform var(--dur-normal) var(--ease-spring),
              box-shadow var(--dur-normal);
}
.board-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }

/* 3-preview 레이아웃 */
.board-preview {
  display: grid;
  grid-template-columns: 2fr 1fr;
  grid-template-rows: 1fr 1fr;
  aspect-ratio: 16/9;
  gap: 2px;
  background: var(--color-border);
}
.board-preview-main { grid-row: 1 / 3; }
.board-preview img  { width: 100%; height: 100%; object-fit: cover; display: block; }

/* 메타 영역 */
.board-meta { padding: 12px 14px; }
.board-title {
  font-size: var(--text-md); font-weight: var(--fw-bold);
  color: var(--color-text-primary);
  margin-bottom: 4px; line-height: 1.3;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.board-author {
  display: flex; align-items: center; gap: 5px;
  font-size: var(--text-xs); color: var(--color-text-tertiary);
}

/* 인증 뱃지 ✓ (Cosmos 스타일) */
.cosmos-verified {
  display: inline-flex; align-items: center; justify-content: center;
  width: 14px; height: 14px; border-radius: 50%;
  background: var(--color-text-primary);
  color: var(--color-bg);
  font-size: 8px; font-weight: 900;
  flex-shrink: 0;
}
```

### 5.6 Pin Card (다크 모드 강화)

```css
/* 다크 모드에서 Pin Card */
@media (prefers-color-scheme: dark) {
  .pin-card {
    background: var(--dark-surface-1);
    box-shadow: 0 1px 0 rgba(255,255,255,0.04);  /* 미묘한 상단 글로우 */
  }
  .pin-card:hover {
    box-shadow: 0 4px 24px rgba(0,0,0,0.6);
  }
  .pin-dim { background: rgba(0,0,0,0); }
  .pin-card:hover .pin-dim { background: rgba(0,0,0,0.4); }
}
```

### 5.7 Bottom Navigation (Cosmos 스타일)

```
┌────────────────────────────────────────────────┐
│         🏠           🔍           👤           │
│        홈           탐색          나           │
└────────────────────────────────────────────────┘
```

```css
/* 모바일 / 반응형 Bottom Tab */
.cosmos-bottom-nav {
  display: none;  /* 데스크톱에서는 숨김 */
  position: fixed; bottom: 0; left: 0; right: 0;
  height: 56px;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  z-index: var(--z-sticky);
  display: flex; align-items: center; justify-content: space-around;
  padding-bottom: env(safe-area-inset-bottom);  /* iPhone 홈 인디케이터 */
}
@media (max-width: 767px) { .cosmos-bottom-nav { display: flex; } }

.bottom-nav-item {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; gap: 3px;
  padding: 8px 0; cursor: pointer;
  color: var(--color-text-tertiary);
  transition: color var(--dur-fast);
}
.bottom-nav-item.active { color: var(--color-text-primary); }
.bottom-nav-icon { font-size: 22px; }
.bottom-nav-label { font-size: var(--text-2xs); font-weight: var(--fw-medium); }
```

### 5.8 Element Count Badge

Cosmos의 "537 elements" 스타일:

```css
.element-count {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  font-weight: var(--fw-regular);
}
.element-count::before { content: '· '; }
```

### 5.9 Cosmos 이미지 오버레이 — Play/Expand 버튼

우상단 ▷ 버튼 (Cosmos에서 목격):

```css
.cosmos-play-btn {
  position: absolute; top: 10px; right: 10px;
  width: 32px; height: 32px; border-radius: 50%;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 12px;
  opacity: 0; transition: opacity var(--dur-fast);
}
.pin-card:hover .cosmos-play-btn { opacity: 1; }
```

---

## 6. 페이지별 Cosmos-Admin 레이아웃

### 6.1 사진 관리 페이지 — Cosmos 통합 레이아웃

```
┌─────────────────────────────────────────────────────────────────┐
│  [←] HAPPINESS ADMIN                     [⚙️] [🌙]            │  topbar
├─────────────────────────────────────────────────────────────────┤
│  🔍 Try '웨딩 스냅, 포트레이트...'                        [·:·] │  search
├─────────────────────────────────────────────────────────────────┤
│  전체  웨딩  인물  풍경  스냅  건축  여행  ···               │  category tabs
│  ────                                                            │  (Cosmos underline)
├─────────────────────────────────────────────────────────────────┤
│  ┌────────┬───┬──────────────────────────────────┐              │  Cosmos collage hero
│  │        │   │                                  │              │
│  │ [img]  │[s]│         [img]                    │              │
│  │        │[s]│                                  │              │
│  └────────┴───┴──────────────────────────────────┘              │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │  Board 카드
│  │[3 thumb] │  │[3 thumb] │  │[3 thumb] │  │[3 thumb] │       │
│  │ 타이틀   │  │ 타이틀   │  │ 타이틀   │  │ 타이틀   │       │
│  │@user ✓ n│  │@user ✓ n│  │@user ✓ n│  │@user ✓ n│       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
├─────────────────────────────────────────────────────────────────┤
│  [ Pin ] [ Pin ] [ Pin ] [ Pin ] [ Pin ]                        │  Masonry grid
│  [ Pin ] [ Pin ] [ Pin ] [ Pin ] [ Pin ]                        │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 대시보드 — Cosmos 다크 통계

```
┌─────────────────────────────────────────────────────────────────┐
│  HAPPINESS ADMIN                          2026.06.23 월         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │          최근 업로드 (콜라주)                               │  │
│  │  ┌──────┬───┬────────┐                                     │  │
│  │  │      │   │        │                                     │  │
│  │  │ img  │img│  img   │   2px gap collage                   │  │
│  │  │      │   │        │                                     │  │
│  │  └──────┴───┴────────┘                                     │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │   1,284  │ │    342   │ │   28,491 │ │    18    │          │
│  │    사진  │ │    회원  │ │  좋아요  │ │  심사중  │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                  │
│  ── 심사 대기 포트폴리오 ────────────────────────────────────── │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│  │[3 thumb] │  │[3 thumb] │  │[3 thumb] │                      │
│  │ 봄 컬렉션│  │ 도시스냅 │  │ 웨딩2026 │                      │
│  │@user ✓ 12│  │@user ✓ 8│  │@user ✓ 24│                      │
│  └──────────┘  └──────────┘  └──────────┘                      │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 포트폴리오 관리 — Cosmos Board 뷰

```
┌─────────────────────────────────────────────────────────────────┐
│  [←] 포트폴리오 관리                              총 42개        │
├─────────────────────────────────────────────────────────────────┤
│  🔍 제목, 작가 검색                                         [·:·]│
├─────────────────────────────────────────────────────────────────┤
│  전체  임시저장  심사중  승인  반려                               │
│  ────                                                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │  ┌────┐  ┌──┐   │  │  ┌────┐  ┌──┐   │  │  ┌────┐  ...│  │
│  │  │    │  │  │   │  │  │    │  │  │   │  │  │    │     │  │
│  │  │main│  ├──┤   │  │  │main│  ├──┤   │  │  │main│     │  │
│  │  │    │  │  │   │  │  │    │  │  │   │  │  │    │     │  │
│  │  └────┘  └──┘   │  │  └────┘  └──┘   │  │  └────┘     │  │
│  │  봄의 포트폴리오  │  │  도시 스케치      │  │  빛의 탐구   │  │
│  │  @user1 ✓ 12장  │  │  @user2 ✓ 8장   │  │  @user3 24장│  │
│  │  [PENDING 심사중]│  │  [APPROVED ✓]   │  │  [APPROVED] │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. 다크/라이트 모드 토글 UI

Cosmos 앱의 순수 다크와 Pinterest의 따뜻한 라이트를 모두 완성도 있게:

```
[사이드바 하단 / 탑바 우측]

라이트 모드: [🌙]   →   클릭 →  [☀️] 다크 모드
```

```css
.theme-toggle {
  width: 40px; height: 22px;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: 11px;
  position: relative; cursor: pointer;
  transition: background var(--dur-normal);
}
.theme-toggle-knob {
  position: absolute; top: 2px; left: 2px;
  width: 18px; height: 18px; border-radius: 50%;
  background: var(--color-text-primary);
  transition: transform var(--dur-normal) var(--ease-spring);
}
[data-theme="dark"] .theme-toggle-knob {
  transform: translateX(18px);
}
```

---

## 8. 마이크로 인터랙션

### 8.1 Cosmos 이미지 로딩 시퀀스

```
1. 이미지 자리 → 다크 placeholder (배경색 + 미묘한 shimmer)
2. 이미지 로드 완료 → opacity 0 → 1 (300ms ease)
3. 첫 번째 픽셀 → 점진적 블러해제 (filter: blur(4px) → blur(0))
```

```css
.cosmos-img {
  opacity: 0;
  filter: blur(4px);
  transition: opacity 300ms ease, filter 400ms ease;
}
.cosmos-img.loaded {
  opacity: 1;
  filter: blur(0);
}
```

### 8.2 카드 등장 애니메이션 (스크롤 트리거)

```css
.pin-card {
  opacity: 0;
  transform: translateY(16px);
  transition: opacity var(--dur-slow) var(--ease-out),
              transform var(--dur-slow) var(--ease-out);
}
.pin-card.visible {
  opacity: 1;
  transform: translateY(0);
}
/* IntersectionObserver로 .visible 클래스 추가 */
```

### 8.3 탭 전환 — 슬라이딩 underline

```css
.cosmos-tabs { position: relative; }
.cosmos-tab-indicator {
  position: absolute; bottom: 0; height: 2px;
  background: var(--color-text-primary);
  border-radius: 1px;
  transition: left var(--dur-normal) var(--ease-spring),
              width var(--dur-normal) var(--ease-spring);
}
```

---

## 9. 반응형 — Mobile First (Cosmos 앱 경험)

| 뷰포트 | 레이아웃 | 사이드바 | 그리드 |
|--------|---------|---------|--------|
| < 768px | Bottom Tab (Cosmos 스타일) | 숨김 | 2컬럼 |
| 768–1023px | Top Nav | 아이콘 레일 | 3컬럼 |
| ≥ 1024px | Side Rail | 68px 고정 | 4–5컬럼 |

```css
/* 모바일: 콘텐츠 영역 bottom 패딩 (Bottom Nav 높이) */
@media (max-width: 767px) {
  .main-content { padding-bottom: calc(56px + env(safe-area-inset-bottom)); }
  .masonry-grid { column-count: 2; column-gap: 8px; }
}
```

---

## 10. 최종 통합 구현 체크리스트

### 다크 테마 (Cosmos)
- [ ] `--dark-bg: #000000` (pure black) 적용
- [ ] 이미지 로딩 blur → clear 시퀀스
- [ ] 탭 underline 슬라이딩 애니메이션
- [ ] Cosmos pill search (italic placeholder)
- [ ] 인증 뱃지 `✓` 원형
- [ ] Bottom Tab Nav (모바일)
- [ ] `env(safe-area-inset-bottom)` iPhone 지원

### 이미지 그리드
- [ ] 콜라주 히어로 영역 (2px gap, 3-cell)
- [ ] Board 3-preview 카드
- [ ] Masonry 메인 그리드
- [ ] hover play 버튼 (우상단 원형)
- [ ] 카드 등장 scroll 애니메이션

### 통합
- [ ] 라이트/다크 모드 `CSS 변수` 단일 인터페이스
- [ ] 테마 토글 (슬라이드 switch)
- [ ] `@media (prefers-color-scheme: dark)` 자동 감지
- [ ] `@media (prefers-reduced-motion: reduce)` 모션 비활성화

---

*Happiness Admin — Cosmos Design Spec v1.0*
*작성일: 2026-06-23*
*레퍼런스: Cosmos iOS 앱 스크린샷 분석*

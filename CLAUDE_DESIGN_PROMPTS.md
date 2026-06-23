# Happiness Admin — Claude 디자인 프롬프트 모음

> **용도**: Claude에게 UI 컴포넌트 구현을 요청할 때 복사·붙여넣기하는 표준 프롬프트
> **레퍼런스**: Cosmos 앱 (다크, 콜라주, 최소 UI) + Pinterest (메이슨리, 카드 호버)
> **업데이트**: 2026-06-23

---

## 시스템 컨텍스트 블록 (모든 프롬프트에 붙이는 공통 헤더)

```
[시스템 컨텍스트]
앱 이름: Happiness Admin — 포트폴리오 사진 어드민 대시보드
기술 스택: React 18 SPA, React Router v6, CSS Modules (또는 별도 .css 파일)
아이콘: lucide-react (import { X, Search, ChevronDown, ... } from 'lucide-react')
상태 관리: useState, useCallback, useSearchParams (외부 상태 라이브러리 없음)

디자인 컨셉: Cosmos 앱 (다크, 콜라주, 미니멀) × Pinterest (메이슨리, 카드 호버)
레퍼런스:
  - Cosmos: 순수 블랙 배경, tracked 앱 제목, pill 검색바(이탤릭 placeholder),
             underline 탭 인디케이터, 2px gap 콜라주 이미지 그룹,
             Board 3-preview 카드, ✓ 원형 인증 뱃지, 하단 3-아이콘 탭
  - Pinterest: column-count 메이슨리, 카드 호버 시 딤+액션버튼, translateY(-2px) 리프트,
               Pin Red(#E60023) CTA, 따뜻한 크림(#FAFAF8) 라이트 배경

CSS 변수 시스템:
  /* 라이트 (기본) */
  --color-bg:           #FAFAF8;
  --color-surface:      #FFFFFF;
  --color-surface-2:    #F5F5F0;
  --color-surface-3:    #EDECEA;
  --color-border:       #D9D8D4;
  --color-text-primary: #111110;
  --color-text-secondary: #4A4944;
  --color-text-tertiary:  #76756E;
  --color-brand:        #E60023;   /* Pin Red */

  /* 다크 (Cosmos) */
  [data-theme="dark"] {
    --color-bg:           #000000;
    --color-surface:      #111111;
    --color-surface-2:    #1A1A1A;
    --color-surface-3:    #242424;
    --color-border:       #2A2A2A;
    --color-text-primary: #FFFFFF;
    --color-text-secondary: #A0A0A0;
    --color-text-tertiary:  #606060;
    --color-brand:        #FFFFFF;
  }

  --font-sans: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --radius-sm: 8px; --radius-md: 12px; --radius-lg: 16px;
  --radius-xl: 24px; --radius-full: 9999px;
  --shadow-pin: 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06);
  --shadow-pin-hover: 0 4px 16px rgba(0,0,0,0.14), 0 8px 32px rgba(0,0,0,0.08);
  --dur-fast: 120ms; --dur-normal: 200ms; --dur-slow: 320ms;
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

규칙:
  - export default 함수형 컴포넌트 (JSX + 별도 .css 파일)
  - 한국어 UI 텍스트
  - 라이트/다크 모드 CSS 변수로 자동 전환
  - 이미지는 ImgWithFallback 컴포넌트 사용 (이미 존재)
  - API 호출: getApi, postApi, patchApi, deleteApi (utils/api.js)
  - 토스트: toast.success() / toast.error() (react-hot-toast)
  - 확인 다이얼로그: useConfirm() 훅 (context/ConfirmContext)
  - 페이지네이션: <Pagination page={} totalPages={} onPageChange={} />
  - 슬라이드 패널: <SlideOver open={} onClose={} title={} footer={} />
```

---

## 프롬프트 1 — Cosmos 검색바 컴포넌트

```
[시스템 컨텍스트 — 위 블록 붙여넣기]

CosmosSearchBar 컴포넌트를 만들어줘.

props:
  - value: string
  - onChange: (value: string) => void
  - placeholder: string (기본값: "Try '웨딩 스냅, 포트레이트...'")
  - onFilterClick?: () => void   (우측 dot-filter 아이콘 클릭)

디자인 요구사항:
1. pill 모양 (border-radius: 9999px)
2. 배경: var(--color-surface-2), border: 1px solid var(--color-border)
3. placeholder: 이탤릭체, var(--color-text-tertiary)
4. 포커스 시: 배경 var(--color-surface), border-color var(--color-text-primary), 이탤릭 해제
5. 좌측: Search 아이콘 (lucide-react, 16px, var(--color-text-tertiary))
6. 우측: SlidersHorizontal 아이콘 (lucide-react, 16px) — onFilterClick 연결
7. 다크모드: border-color #FFFFFF on focus (CSS 변수 자동)
8. 300ms 디바운스는 부모에서 처리 (이 컴포넌트는 controlled)

파일: frontend/src/components/common/CosmosSearchBar.jsx
      frontend/src/components/common/CosmosSearchBar.css
```

---

## 프롬프트 2 — Category Tab Bar (Cosmos underline 스타일)

```
[시스템 컨텍스트 — 위 블록 붙여넣기]

CosmosTabs 컴포넌트를 만들어줘.

props:
  - tabs: Array<{ key: string; label: string; count?: number }>
  - activeKey: string
  - onChange: (key: string) => void

디자인 요구사항:
1. 수평 스크롤 (scrollbar hidden)
2. 각 탭: padding 10px 16px, font-size 13px
3. 비활성: var(--color-text-tertiary), font-weight 400
4. 활성: var(--color-text-primary), font-weight 600,
         하단 2px solid var(--color-text-primary) underline
5. underline은 별도 div로 position absolute, 활성 탭 위치로 슬라이딩 애니메이션
   (JS로 활성 탭 offsetLeft + offsetWidth 측정 → left, width transition)
6. count가 있으면 탭 라벨 우측에 작은 숫자 표시 (gray, 11px)
7. 하단 border: 1px solid var(--color-border) (탭바 전체)
8. 다크모드: underline = white, 비활성 = #606060

파일: frontend/src/components/common/CosmosTabs.jsx
      frontend/src/components/common/CosmosTabs.css
```

---

## 프롬프트 3 — Cosmos Collage Hero (이미지 콜라주)

```
[시스템 컨텍스트 — 위 블록 붙여넣기]

CosmosCollage 컴포넌트를 만들어줘.
사진 3~5장을 Cosmos 앱처럼 2px 갭의 콜라주로 보여주는 히어로 영역.

props:
  - photos: Array<{ id, imageUrl, thumbnailUrl, title }>  (최대 5장)
  - onPhotoClick?: (photo) => void

레이아웃 (3장):
  ┌──────────┬──────┬──────────────────────┐
  │          │  s1  │                      │
  │  main    ├──────┤   right (tall)       │
  │          │  s2  │                      │
  └──────────┴──────┴──────────────────────┘
  grid-template-columns: 2fr 1fr 2fr
  grid-template-rows: 1fr 1fr
  gap: 2px
  aspect-ratio: 21/9 (시네마틱)

레이아웃 (4장):
  ┌──────────────┬──────┬──────┐
  │              │  s1  │  s3  │
  │  main (2row) ├──────┴──────┤
  │              │  s2 (full)  │
  └──────────────┴─────────────┘

레이아웃 (5장):
  ┌──────────┬──────┬──────┬──────┐
  │          │  s1  │      │  s4  │
  │  main    ├──────┤  s3  ├──────┤
  │          │  s2  │      │  s5  │
  └──────────┴──────┴──────┴──────┘

디자인:
  - border-radius: var(--radius-xl) (전체 외곽)
  - overflow: hidden
  - gap 색상: var(--color-border) (배경 역할)
  - 이미지: object-fit cover, 100% width/height
  - 호버 시 이미지 scale(1.03) transition (개별 이미지)
  - 사진이 1장이면 단순 이미지로 표시
  - 사진이 없으면 skeleton shimmer 표시 (var(--color-surface-2) + shimmer)

파일: frontend/src/components/common/CosmosCollage.jsx
      frontend/src/components/common/CosmosCollage.css
```

---

## 프롬프트 4 — Board/Portfolio Card (Cosmos 3-preview 스타일)

```
[시스템 컨텍스트 — 위 블록 붙여넣기]

BoardCard 컴포넌트를 만들어줘.
포트폴리오를 Cosmos의 Board 스타일로 표시하는 카드.

props:
  portfolio: {
    id, title, subtitle, coverImageUrl,
    authorName, authorProfile,
    status, visibility,
    photoCount, seriesCount,
    likesCount, viewCount,
    pinned, createdAt,
    previewImages?: string[]   // 최대 3장 썸네일 URL
  }
  onClick?: () => void

카드 구조:
  ┌────────────────────────────────┐
  │ COVER PREVIEW (3-grid)        │  ← 3-preview 레이아웃
  │  ┌──────────┐  ┌────┐        │    grid: 2fr 1fr / 1fr 1fr
  │  │          │  │ t2 │        │    gap: 2px, aspect-ratio: 4/3
  │  │   main   │  ├────┤        │
  │  │  (t1)    │  │ t3 │        │
  │  └──────────┘  └────┘        │
  ├────────────────────────────────┤
  │  📌 (pinned이면 표시)          │
  │  [STATUS BADGE]               │  ← PENDING/APPROVED/REJECTED/DRAFT
  │  포트폴리오 제목               │  ← bold, 2줄 ellipsis
  │  부제목                       │  ← gray, 1줄 ellipsis
  │  @authorProfile ✓             │  ← verified badge
  │  📷 {photoCount} · ❤ {likes} │  ← 메타
  └────────────────────────────────┘

디자인:
  - 배경: var(--color-surface)
  - border-radius: var(--radius-xl)
  - box-shadow: var(--shadow-pin)
  - 호버: translateY(-2px), shadow 증가, transition 200ms ease-spring
  - cursor: pointer

상태 뱃지:
  - PENDING  → 노란 dot + "심사 중"
  - APPROVED → 초록 dot + "승인"
  - REJECTED → 빨간 dot + "반려"
  - DRAFT    → 회색 dot + "임시저장"
  (.status-dot::before 사용)

인증 뱃지:
  - width:14px, height:14px, border-radius:50%
  - background: var(--color-text-primary), color: var(--color-bg)
  - 내용: "✓" (8px, font-weight 900)

파일: frontend/src/components/common/BoardCard.jsx
      frontend/src/components/common/BoardCard.css
```

---

## 프롬프트 5 — Pin Card (사진 카드, 다크/라이트 완성)

```
[시스템 컨텍스트 — 위 블록 붙여넣기]

PinCard 컴포넌트를 만들어줘.
Masonry 그리드에 들어가는 사진 카드 (Pinterest Pin + Cosmos 다크 감성).

props:
  photo: {
    id, title, imageUrl, thumbnailUrl,
    colorMood, categoryCode, l1Name, l2Name,
    authorName, authorProfile,
    likesCount, savesCount, sharesCount,
    createdAt
  }
  keyword?: string   // 검색 하이라이트용
  onClick?: () => void
  onDelete?: () => void

카드 구조:
  ┌──────────────────────────────────┐
  │  [MOOD BADGE]    [▶ play/open] │  ← 호버 시만 표시
  │                                 │
  │      이미지 (원본 비율 유지)      │
  │      height: auto               │
  │                                 │
  │  [cat-l1] [cat-l2]             │  ← 좌하단 카테고리 뱃지 (호버 시)
  ├──────────────────────────────────┤
  │  제목 (2줄 ellipsis, keyword HL)│
  │  @authorProfile · 날짜          │
  │  ❤ n · 🔖 n · 🔄 n           │
  │  [삭제]                         │  ← danger btn
  └──────────────────────────────────┘

호버 인터랙션 (CSS :hover):
  - 카드: translateY(-2px), shadow 증가
  - 딤 레이어: rgba(0,0,0,0→0.25)
  - [▶ open] 버튼: opacity 0→1, translateY(-6px→0)
  - 카테고리 뱃지: opacity 0→1

이미지:
  - width: 100%, height: auto (원본 비율 유지 — Cosmos 스타일)
  - border-radius: var(--radius-lg) var(--radius-lg) 0 0
  - 로딩 중: skeleton shimmer
  - 로드 완료: opacity 0→1, blur(4px)→blur(0) (Cosmos 이미지 reveal)

키워드 하이라이트:
  - <mark> 태그: background #FEF08A, color #1E293B (라이트)
  - 다크모드: background #854D0E, color #FEF9C3

다크모드:
  - 배경: var(--dark-surface-1, #111111)
  - shadow: 0 1px 0 rgba(255,255,255,0.04)
  - 호버 shadow: 0 4px 24px rgba(0,0,0,0.6)

파일: frontend/src/components/common/PinCard.jsx
      frontend/src/components/common/PinCard.css
```

---

## 프롬프트 6 — Masonry Grid 래퍼

```
[시스템 컨텍스트 — 위 블록 붙여넣기]

MasonryGrid 컴포넌트를 만들어줘.
column-count 방식의 워터폴 메이슨리 그리드.

props:
  - children: React.ReactNode
  - columns?: { sm: number, md: number, lg: number, xl: number }
    기본값: { sm: 2, md: 3, lg: 4, xl: 5 }
  - gap?: number (px, 기본 16)

구현:
  - CSS column-count 방식 (JS 없음, 순수 CSS)
  - break-inside: avoid (카드가 컬럼 경계에서 잘리지 않도록)
  - 각 카드에 margin-bottom: {gap}px

IntersectionObserver 통합:
  - MasonryGrid 내부에서 자식 요소들을 observe
  - 뷰포트에 진입 시 .visible 클래스 추가
  - opacity 0→1, translateY(16px→0) 순차 등장 (stagger: index * 30ms)

반응형:
  @media (max-width: 639px):   column-count: sm (2)
  @media (640px-1023px):       column-count: md (3)
  @media (1024px-1399px):      column-count: lg (4)
  @media (min-width: 1400px):  column-count: xl (5)

파일: frontend/src/components/common/MasonryGrid.jsx
      frontend/src/components/common/MasonryGrid.css
```

---

## 프롬프트 7 — 갤러리 순서 관리 페이지

```
[시스템 컨텍스트 — 위 블록 붙여넣기]

GalleryOrderPage 컴포넌트를 만들어줘.
어드민이 특정 작가의 사진 표시 순서를 드래그&드롭으로 관리하는 페이지.

데이터 흐름:
  GET /api/admin/members?size=100          → 회원 목록 (작가 선택용)
  GET /api/admin/photos?memberId=X&sortBy=displayOrder&size=100 → 사진 목록
  PUT /api/admin/photos/reorder            → Body: [{id, displayOrder}]

UI 구성:

1. 페이지 헤더
   - 제목: "갤러리 순서 관리"
   - 설명: "드래그로 순서를 바꾼 뒤 저장하세요"

2. 컨트롤 바 (흰 카드)
   - 작가 선택 <select> (드롭다운)
   - "n장" 텍스트
   - [날짜순] [좋아요순] 자동 정렬 버튼 (pill)
   - [되돌리기] 버튼 (dirty 시만 활성)
   - [순서 저장] 버튼: 미변경=ghost, 변경=Pin Red, 저장됨=green

3. Dirty 배너 (변경사항 있을 때)
   - "⚠ 저장하지 않은 변경사항"
   - background: var(--color-warning-bg), border-left: 3px solid var(--color-warning)

4. 드래그 그리드 (4컬럼, 모바일 2컬럼)
   각 카드:
   - 썸네일 (aspect-ratio: 1, object-fit: cover)
   - 좌상단: 순서 번호 뱃지 (Pin Red 원형)
   - 우상단: ⣿ 드래그 핸들 아이콘 (cursor: grab)
   - 하단: 사진 제목 (1줄 ellipsis)
   드래그 중: opacity 0.4, scale(1.02)
   드롭 타겟: border: 2px dashed var(--color-brand)

5. HTML5 Drag & Drop:
   onDragStart: dragIndex 저장
   onDragOver: preventDefault()
   onDrop: 배열 swap → dirty = true → 번호 뱃지 즉시 업데이트

6. 저장:
   성공 → toast.success + dirty = false
   실패 → toast.error

7. 이탈 경고:
   dirty 시 beforeunload 이벤트로 브라우저 경고

파일: frontend/src/pages/GalleryOrderPage.jsx
      frontend/src/pages/GalleryOrderPage.css
```

---

## 프롬프트 8 — 방문자 분석 페이지

```
[시스템 컨텍스트 — 위 블록 붙여넣기]

AnalyticsPage 컴포넌트를 만들어줘.
플랫폼 전체 방문자 분석 대시보드.

데이터 흐름:
  GET /api/admin/analytics/summary?period={7d|30d|90d|365d}
      → { portfolioViews, photoViews, likes, saves, inquiries,
          portfolioViewsDelta, likesDelta, savesDelta, inquiriesDelta }
  GET /api/admin/analytics/daily?period={period}&eventType=PORTFOLIO_VIEW
      → [{ date: "2026-06-01", count: 142 }, ...]
  GET /api/admin/analytics/top-members?period={period}&limit=5
      → [{ memberId, authorName, authorProfile, viewCount }, ...]
  GET /api/admin/analytics/top-photos?period={period}&limit=5
      → [{ photoId, title, thumbnailUrl, likesCount }, ...]

UI 구성:

1. 헤더 + 기간 선택
   - "방문자 분석"
   - 기간 Pills: [7일] [30일] [90일] [1년]  (Cosmos 스타일 underline-less, active=filled)

2. KPI 카드 4종 (2×2 그리드, 모바일 1열)
   각 카드:
   - 숫자: 28px extrabold
   - 라벨: 13px tertiary
   - 델타: ↑ green / ↓ red + "이번 기간" 표시
   - 로딩 중: skeleton shimmer

3. 방문 추이 차트 (Recharts LineChart)
   - 라인 색: var(--color-brand) (#E60023)
   - 채움: gradient (brand 20% → transparent)
   - 툴팁: 날짜 + 방문 수
   - Y축: 오른쪽, 4단계
   - X축: 날짜 (7일=요일, 30일=MM/DD, 90일=주, 365일=월)

4. 인기 작가 TOP 5 + 인기 사진 TOP 5 (2컬럼)
   작가:
     순위 번호 | 아바타 이니셜 | 이름 @프로필 | 방문 수 (bar)
   사진:
     순위 | 썸네일 (40×40) | 제목 | 좋아요 수 (bar)
   bar: width = (count/max)*100%, background: var(--color-brand), border-radius: full, height: 4px

5. 기간 변경 시 전체 데이터 재조회 (Promise.all 병렬)

파일: frontend/src/pages/AnalyticsPage.jsx
      frontend/src/pages/AnalyticsPage.css
```

---

## 프롬프트 9 — 납품 포털 관리 페이지

```
[시스템 컨텍스트 — 위 블록 붙여넣기]

DeliveryListPage 컴포넌트를 만들어줘.
납품 세트 목록과 상태를 어드민이 감독하는 페이지.

데이터 흐름:
  GET /api/admin/deliveries?status=&search=&page=
      → Page<{ id, title, clientName, memberId, authorName, authorProfile,
               photoCount, status, expiresAt, viewedAt, approvedAt, feedback, createdAt }>
  GET /api/admin/deliveries/stats
      → { total, pending, reviewed, approved, rejected, expiringIn7days }
  DELETE /api/admin/deliveries/{id}/expire   (강제 만료)

상태값: PENDING / REVIEWED / APPROVED / REJECTED

UI 구성:

1. Stat Row (5개 수평 카드)
   [전체 n] [대기 n] [열람됨 n] [승인 n] [반려 n]
   + 별도: [만료 임박 n] (경고 오렌지)
   클릭 시 status 필터 적용

2. 필터 바
   - 검색: 클라이언트명 / 작가명
   - [만료 임박순] [최신순] 정렬 select

3. 납품 세트 리스트 (테이블 카드 — 이미지 없음)
   각 행:
     제목 | 작가 @프로필 ✓ | 클라이언트명 | 사진 수 | 상태 dot | 만료일 | 액션
   만료 D-7 이내: expiresAt 강조 (orange) + "⚠ D-N" 뱃지
   만료 D-3 이내: pulse 애니메이션

4. SlideOver 상세 (클릭 시)
   - 납품명, 작가 정보
   - 클라이언트명 / 상태
   - 만료일 / 생성일 / 최종 열람일
   - 피드백 텍스트 (있으면)
   - [강제 만료] 버튼 (danger)
   confirm 확인 후 DELETE API 호출

5. Pagination

만료일 계산 헬퍼:
  daysUntilExpiry(expiresAt) → 양수: D-N, 음수: 만료됨

파일: frontend/src/pages/DeliveryListPage.jsx
      frontend/src/pages/DeliveryListPage.css
```

---

## 프롬프트 10 — 촬영 예약 관리 페이지

```
[시스템 컨텍스트 — 위 블록 붙여넣기]

BookingListPage 컴포넌트를 만들어줘.
전체 촬영 예약을 어드민이 감독하는 페이지 (목록 + 캘린더 뷰).

데이터 흐름:
  GET /api/admin/bookings?status=&search=&from=&to=&page=
      → Page<{ id, memberId, authorName, authorProfile, clientName,
               clientPhone, shootDate, shootTime, shootType, memo,
               status, rejectReason, createdAt, confirmedAt }>
  GET /api/admin/bookings/stats?year=2026&month=6
      → { total, requested, confirmed, rejected, cancelled,
          byDay: { "2026-06-08": 3, ... } }

상태값: REQUESTED / CONFIRMED / REJECTED / CANCELLED

UI 구성:

1. 뷰 모드 탭
   [목록 보기] [캘린더 보기]
   (Cosmos underline 탭 스타일)

2. Stat Row (4개 카드)
   [전체] [대기] [확정] [거절+취소]

3. 목록 뷰:
   필터: 상태 select, 검색 (작가/클라이언트), 기간(from~to date)
   테이블 행: 촬영일 | 촬영종류 | 작가 | 클라이언트 | D+N 계산 | 상태 | [상세]
   D-day 계산: shootDate - today (D-5, D+0, D+3 형태)
   SlideOver 상세: 모든 예약 정보 표시 (연락처 포함)

4. 캘린더 뷰:
   CSS Grid 기반 월간 달력 (외부 라이브러리 없음)
   [YYYY년 MM월 ◀ ▶] 헤더
   Mo Tu We Th Fr Sa Su 헤더 행
   날짜 셀 (width: 40px, height: 40px, border-radius: 50%)
   예약 있는 날: Pin Red 도트 (::after)
   오늘: Pin Red 배경 + 흰 텍스트
   날짜 클릭 → 해당 날 예약 목록 하단에 표시

파일: frontend/src/pages/BookingListPage.jsx
      frontend/src/pages/BookingListPage.css
```

---

## 프롬프트 11 — 장르 분류 관리 페이지

```
[시스템 컨텍스트 — 위 블록 붙여넣기]

GenreListPage 컴포넌트를 만들어줘.
12종 사진 장르 현황과 관리 화면.

데이터 흐름:
  GET /api/admin/genres
      → [{ code, nameKo, nameEn, emoji, photoCount, memberCount,
            monthlyUploads, active, sortOrder }]
  POST /api/admin/genres   (장르 추가)
  PATCH /api/admin/genres/{code}  (수정 / 비활성화)

UI 구성:

1. 헤더 + [+ 장르 추가] 버튼

2. 장르 카드 그리드 (3컬럼, 모바일 2컬럼)
   각 카드 (Pinterest 스타일 pin card):
   ┌──────────────────────────────┐
   │  {emoji}  {nameKo}           │  ← 이모지 + 이름
   │  ──────────────────────────  │
   │  사진 {photoCount}장         │
   │  작가 {memberCount}명        │
   │  이번달 +{monthlyUploads}    │
   │  [비활성화됨] (active=false) │
   │  [사진 보기] [수정]          │
   └──────────────────────────────┘
   비활성 장르: opacity 0.5, "비활성화됨" 뱃지

3. [사진 보기] 클릭 → 해당 장르 사진 목록 SlideOver
   GET /api/admin/genres/{code}/photos
   SlideOver 내부: MasonryGrid 2컬럼 (PinCard 사용)

4. [+ 장르 추가] 모달 (SlideOver 사용)
   - 코드 input (영어 대문자)
   - 이모지 input
   - 한글명 / 영문명 input
   - 정렬 순서 number input
   - [취소] [저장] 버튼

5. [수정] 클릭 → 해당 장르 SlideOver (같은 폼, PATCH 호출)
   - [비활성화] 토글 포함

파일: frontend/src/pages/GenreListPage.jsx
      frontend/src/pages/GenreListPage.css
```

---

## 프롬프트 12 — 아이콘 레일 사이드바 (Cosmos 스타일 업데이트)

```
[시스템 컨텍스트 — 위 블록 붙여넣기]

Sidebar.jsx를 Cosmos 아이콘 레일 스타일로 완전 교체해줘.

요구사항:
1. 너비: 68px 고정, position: fixed, top: 0, left: 0, height: 100vh
2. 배경: var(--color-bg), border-right: 1px solid var(--color-border)
3. z-index: 100 (var(--z-sticky))

네비게이션 아이템 목록:
  / → LayoutDashboard (대시보드)
  /photos → Image (사진 관리)
  /gallery-order → GalleryVertical (갤러리 순서) [NEW]
  /portfolios → FolderOpen (포트폴리오)
  /series → BookOpen (시리즈)
  /genres → Tag (장르) [NEW]
  --- 구분선 ---
  /inquiries → MessageSquare (문의)
  /deliveries → Package (납품 포털) [NEW]
  /bookings → CalendarDays (촬영 예약) [NEW]
  --- 구분선 ---
  /stats → BarChart2 (통계)
  /analytics → TrendingUp (방문자 분석) [NEW]
  --- 구분선 ---
  /audit-logs → Shield (감사 로그) [NEW]
  /system → Settings (시스템)

각 아이템 스타일:
  - width: 44px, height: 44px, border-radius: var(--radius-md)
  - 기본: background transparent, color var(--color-text-tertiary)
  - 호버: background var(--color-surface-2), color var(--color-text-primary)
  - 활성: background var(--pin-red-light, #FFEBEE), color var(--pin-red)
           왼쪽 3px bar: position absolute, left: -1px, width: 3px,
                          height: 20px, background: var(--pin-red), border-radius: 0 2px 2px 0
  - 다크 활성: background #2A0A0E, color var(--pin-red-dark)

툴팁 (::after):
  content: attr(data-label)
  left: calc(100% + 12px)
  opacity 0→1 on hover (100ms)
  background: var(--color-surface-3), color: var(--color-text-primary)
  border: 1px solid var(--color-border)
  border-radius: var(--radius-sm), padding: 5px 10px
  white-space: nowrap, font-size: 13px

하단:
  --- 구분선 ---
  테마 토글 버튼 (Sun/Moon icon, 클릭 시 data-theme 토글)
  사용자 아바타 (이니셜 원형)
    hover → "로그아웃" 툴팁 + 클릭 시 로그아웃

구분선:
  width: 32px, height: 1px, background: var(--color-border), margin: 8px 0

파일: frontend/src/components/layout/Sidebar.jsx  (교체)
      frontend/src/components/layout/Sidebar.css  (교체)
```

---

## 프롬프트 13 — 대시보드 페이지 (Cosmos × Pinterest 통합)

```
[시스템 컨텍스트 — 위 블록 붙여넣기]

DashboardPage.jsx를 Cosmos × Pinterest 통합 디자인으로 완전 재작성해줘.

데이터 흐름:
  GET /api/admin/stats/summary → { totalPhotos, totalMembers, totalInquiries,
                                    pendingPortfolios, newPhotosToday, newMembersToday }
  GET /api/admin/photos?sortBy=latest&size=5 → 최근 사진 5장 (콜라주용)
  GET /api/admin/portfolios?status=PENDING&size=3 → 심사 대기 포트폴리오

UI 구성:

1. 페이지 헤더
   "안녕하세요, {user.name}님" (18px bold)
   오늘 날짜 (tertiary, 13px)

2. Cosmos Collage Hero (최근 사진 5장)
   <CosmosCollage photos={recentPhotos} />
   높이: 240px, aspect-ratio 21/9

3. KPI 카드 4종 (2×2 → 모바일 2×2)
   [사진 n장  +n오늘]
   [회원 n명  +n오늘]
   [문의 n건]
   [심사 대기 n개  — Pin Red 강조]

4. 심사 대기 포트폴리오 섹션
   제목: "심사 대기 포트폴리오" + [모두 보기→] 링크
   <BoardCard> 3개 (포트폴리오 카드)

5. 빠른 액션 링크
   [🖼️ 갤러리 순서] [📊 방문자 분석] [💬 문의 확인]
   pill 버튼, 클릭 시 라우터 이동

파일: frontend/src/pages/DashboardPage.jsx  (재작성)
      (DashboardPage.css가 있으면 업데이트, 없으면 생성)
```

---

## 공통 가이드라인 (모든 프롬프트 적용)

### 금지 사항
- `style={{ }}` 인라인 스타일 (별도 .css 파일 사용)
- 테이블 레이아웃 (이미지 있는 콘텐츠에는 카드 사용)
- 고정 높이 이미지 (height: auto로 비율 유지)
- 외부 CSS 라이브러리 (styled-components, tailwind 등)
- 한국어 이외의 UI 텍스트 (에러 메시지, 뱃지 등 모두 한국어)

### 필수 패턴
- 로딩: skeleton shimmer (`.skeleton` 클래스)
- 빈 상태: 이모지 아이콘 + 제목 + 설명 (`.empty-state`)
- 에러: toast.error()
- 삭제/위험: useConfirm() confirm 먼저
- 이미지: `<ImgWithFallback>` 컴포넌트 사용
- 목록: `useSearchParams`로 URL 상태 동기화 (search, page, filter)
- 다크모드: CSS 변수만 사용 (JS 조작 금지)

### 파일명 컨벤션
- 페이지: `{Name}Page.jsx` + `{Name}Page.css`
- 컴포넌트: `{Name}.jsx` + `{Name}.css`
- 위치: 페이지 → `src/pages/`, 공통 컴포넌트 → `src/components/common/`

---

*Happiness Admin — Claude Design Prompts v1.0*
*작성일: 2026-06-23*

# Happiness Admin — 디자인 레퍼런스

> **목적:** 코딩 중 참조하는 실용 가이드. 토큰·컴포넌트·패턴을 한 곳에서 찾는다.  
> 폰트: `Pretendard` (CDN) | 아이콘: `lucide-react` | 차트: `recharts`

---

## 1. 컬러 시스템

### 브랜드
| 토큰 | 값 | 용도 |
|---|---|---|
| `--color-brand-500` | `#6366f1` | 주 강조, 활성 상태, CTA |
| `--color-brand-600` | `#4f46e5` | 버튼 hover |
| `--color-brand-400` | `#818cf8` | 사이드바 활성 텍스트 |
| `--color-brand-100` | `#e0e7ff` | 배지 배경, 선택 행 bg |
| `--color-brand-50`  | `#eef2ff` | 카드 강조 bg |

### 시맨틱
| 토큰 | 값 | 용도 |
|---|---|---|
| `--color-success`    | `#22c55e` | 저장 완료, 활성 상태 |
| `--color-success-bg` | `#dcfce7` | 성공 배지 bg |
| `--color-warning`    | `#f59e0b` | 경고, 미읽음 카운트 |
| `--color-warning-bg` | `#fffbeb` | 경고 배지 bg |
| `--color-danger`     | `#ef4444` | 삭제, 오류 |
| `--color-danger-bg`  | `#fef2f2` | 위험 배지 bg |
| `--color-info`       | `#06b6d4` | 안내, 링크 |

### 중립 & 텍스트
| 토큰 | 값 | 용도 |
|---|---|---|
| `--color-bg`             | `#f1f5f9` | 앱 전체 배경 |
| `--color-surface`        | `#ffffff` | 카드, 모달, 입력 |
| `--color-surface-2`      | `#f8fafc` | 테이블 헤더, 호버 행 |
| `--color-border`         | `#e2e8f0` | 일반 테두리 |
| `--color-border-light`   | `#f1f5f9` | 섹션 구분선 |
| `--color-text-primary`   | `#0f172a` | 제목, 본문 |
| `--color-text-secondary` | `#475569` | 서브 텍스트 |
| `--color-text-tertiary`  | `#94a3b8` | 메타, 라벨 |

### 사이드바 전용
| 토큰 | 값 |
|---|---|
| `--color-sidebar-bg`          | `#0f172a` |
| `--color-sidebar-hover`       | `#1e293b` |
| `--color-sidebar-border`      | `#1e293b` |
| `--color-sidebar-text`        | `#94a3b8` |
| `--color-sidebar-active-text` | `#818cf8` |

---

## 2. 타이포그래피

```css
--font-sans: 'Pretendard', 'Inter', -apple-system, sans-serif;

--text-xs:   11px   /* 메타, 배지 */
--text-sm:   13px   /* 테이블 본문, 부제목 */
--text-base: 14px   /* 기본 본문 */
--text-md:   15px   /* 강조 본문 */
--text-lg:   18px   /* 섹션 제목 */
--text-xl:   22px   /* 카드 숫자값 */
--text-2xl:  28px   /* 페이지 타이틀 */
```

**Font Weight 규칙**
- `400` — 일반 본문
- `500` — 레이블, 설명
- `600` — 서브 제목, 버튼
- `700` — 제목, 강조
- `800` — 통계 숫자, 주요 제목

---

## 3. 스페이싱 & 라디우스

```css
/* 스페이싱 (4px 단위) */
--space-1:  4px
--space-2:  8px
--space-3:  12px
--space-4:  16px    /* 카드 내부 기본 패딩 */
--space-5:  20px
--space-6:  24px    /* 페이지 콘텐츠 패딩 */
--space-8:  32px
--space-10: 40px
--space-12: 48px

/* 라디우스 */
--radius-sm: 4px    /* 작은 배지, 태그 */
--radius-md: 8px    /* 버튼, 입력 */
--radius-lg: 12px   /* 카드, 모달 */
--radius-xl: 16px   /* 큰 카드, 패널 */
```

---

## 4. 그림자

```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05)           /* 입력, 배지 */
--shadow-md: 0 1px 3px rgba(0,0,0,0.10), ...       /* 카드 기본 */
--shadow-lg: 0 4px 6px rgba(0,0,0,0.07), ...       /* hover 카드, 드롭다운 */
--shadow-xl: 0 10px 15px rgba(0,0,0,0.10), ...     /* 모달, 사이드바 */
```

---

## 5. 레이아웃

```
┌──────────────────────────────────────────────────────┐
│ 사이드바 240px (fixed, dark)  │  콘텐츠 영역          │
│                               │  padding: 24px       │
│  🌟 Happiness Admin           │  max-width: 페이지별  │
│  ─────────────────            │                      │
│  대시보드                     │  ┌──────────────────┐ │
│  회원 관리                    │  │ 페이지 콘텐츠     │ │
│  사진 관리                    │  └──────────────────┘ │
│  문의 관리                    │                      │
│  시리즈 관리                  │                      │
│  통계                         │                      │
│  시스템 설정                  │                      │
│  ─────────────────            │                      │
│  [유저 정보]                  │                      │
│  [로그아웃]                   │                      │
└──────────────────────────────────────────────────────┘
```

- 사이드바: `240px`, `position: fixed`, bg `#0f172a`
- 콘텐츠: `margin-left: 240px`, `padding: 24px`, bg `#f1f5f9`
- 콘텐츠 최대 폭: 목록 `1200px` / 폼 `720px` / 통계 `1100px`

---

## 6. 컴포넌트 패턴

### 통계 카드 (StatCard)

```
┌─────────────────────────────────┐
│ 🟣          전체 회원           │
│  [아이콘]   ──────────          │
│  배경 원    1,234               │
│  (brand18%) 텍스트-primary 800  │
└─────────────────────────────────┘
border-left: 4px solid {color}
```

```jsx
// 사용 예
<Link to="/members" className="stat-card" style={{ borderLeft: `4px solid #6366f1` }}>
  <div className="stat-icon" style={{ background: '#6366f118', color: '#6366f1' }}>👥</div>
  <div className="stat-info">
    <div className="stat-value">1,234</div>
    <div className="stat-label">전체 회원</div>
  </div>
  <ArrowUpRight size={14} />
</Link>
```

---

### 배지 (Badge)

| 종류 | bg | color | 사용 |
|---|---|---|---|
| success | `--color-success-bg` | `--color-success` | 읽음, 활성 |
| warning | `--color-warning-bg` | `--color-warning` | 미읽음 |
| danger  | `--color-danger-bg`  | `--color-danger`  | 삭제, 비활성 |
| brand   | `--color-brand-100`  | `--color-brand-500` | 어드민 역할 |
| neutral | `--color-surface-2`  | `--color-text-tertiary` | USER 역할, 기본 |

```jsx
<span className="badge badge-success">읽음</span>
<span className="badge badge-warning">미읽음</span>
<span className="badge badge-danger">정지</span>
```

---

### 버튼

| 종류 | 설명 | 클래스 |
|---|---|---|
| Primary | 주요 CTA (저장, 생성) | `.btn.btn-primary` |
| Secondary | 보조 액션 (취소, 목록) | `.btn.btn-secondary` |
| Danger | 삭제, 비가역 작업 | `.btn.btn-danger` |
| Ghost | 아이콘 버튼, 드롭다운 | `.btn.btn-ghost` |

**위험 버튼 필수 조건:** `useConfirm()` 훅으로 이중 확인 → `window.confirm` 절대 사용 금지

```jsx
const confirm = useConfirm();

const handleDelete = async () => {
  const ok = await confirm({
    title: '회원 삭제',
    description: '이 작업은 되돌릴 수 없습니다.',
    variant: 'danger',
  });
  if (!ok) return;
  // 삭제 API 호출
};
```

---

### 데이터 테이블

```
┌────────────────────────────────────────────────────┐
│ [검색창]              [필터]       [+ 추가 버튼]    │
├──────┬──────────┬──────────┬───────┬───────────────┤
│  ID  │   이름   │  이메일  │  권한  │     관리      │
├──────┼──────────┼──────────┼───────┼───────────────┤
│  1   │  홍길동  │ @ex.com  │ ADMIN │ [편집] [삭제] │
│  2   │  김영희  │ @ex.com  │ USER  │ [편집] [삭제] │
└──────┴──────────┴──────────┴───────┴───────────────┘
         [이전]  1  2  3  [다음]
```

- 헤더 bg: `--color-surface-2`, `font-weight: 600`, `text-transform: uppercase`, `letter-spacing: 0.05em`
- 행 hover: bg `--color-surface-2`
- 행 구분선: `1px solid --color-border-light`
- 페이지네이션: `<Pagination>` 공통 컴포넌트 사용

---

### 폼 입력

```jsx
// 텍스트 입력
<div className="form-group">
  <label className="form-label">이름</label>
  <input type="text" className="form-input" placeholder="..." />
  <span className="form-error">오류 메시지</span>
</div>

// Select
<select className="form-select">
  <option>선택하세요</option>
</select>
```

- `focus` 상태: `border-color: --color-brand-500`, `box-shadow: 0 0 0 3px rgba(99,102,241,0.15)`
- 오류 상태: `border-color: --color-danger`

---

### ConfirmDialog

모든 비가역 작업(삭제·권한 변경)은 `ConfirmContext`의 `useConfirm()` 사용.

```jsx
import { useConfirm } from '../context/ConfirmContext';

// variant: 'danger' | 'warning'
const ok = await confirm({ title: '...', description: '...', variant: 'danger' });
```

- 오버레이 클릭 → 취소
- `Escape` → 취소
- 확인 버튼: danger variant는 빨간색 (`--color-danger`)

---

### ImgWithFallback

```jsx
import ImgWithFallback from '../components/common/ImgWithFallback';

<ImgWithFallback src={photo.thumbnailUrl} alt={photo.title} className="photo-thumb" />
```

로드 실패 시 회색 플레이스홀더 자동 표시.

---

## 7. 페이지별 디자인 패턴

### 대시보드 (`/`)
- 상단: 4개 `StatCard` (2×2 그리드)
- 중단: 2-col 그리드 — 바차트(7일 업로드) + TOP5 사진 리스트
- 하단: 최근 문의 5건 테이블 (full-width)
- 차트 색상: 반드시 hex 직접 지정 (`fill="#6366f1"`), CSS 변수 사용 불가 (SVG 미지원)

### 목록 페이지 (회원·사진·문의·시리즈)
- 상단: 페이지 제목 + [검색창] + [액션 버튼]
- 본문: `data-table` 패턴
- 하단: `<Pagination>` 컴포넌트
- 빈 상태: 아이콘 + 안내 텍스트 + [추가하기] 버튼

### 통계 (`/stats`)
- 날짜 범위 선택 (30/90/365일)
- 꺾은선 차트 (일별 업로드/가입)
- 파이 차트 (colorMood 분포)
- 바차트 (탑 멤버/사진)

### 시스템 (`/system`)
- 읽기 전용 서버 상태 카드
- DB 연결 상태, JVM 메모리, 업타임

---

## 8. 차트 컬러 (Recharts)

SVG `fill`/`stroke`에는 CSS 변수가 동작하지 않으므로 반드시 hex 직접 사용.

```js
const CHART_COLORS = {
  brand:   '#6366f1',
  success: '#22c55e',
  warning: '#f59e0b',
  danger:  '#ef4444',
  info:    '#06b6d4',
  purple:  '#a78bfa',
  pink:    '#f472b6',
  series: ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#a78bfa'],
};
```

---

## 9. 인터랙션 규칙

| 상황 | 규칙 |
|---|---|
| 비가역 작업 | `useConfirm()` 이중 확인 필수 |
| 성공 피드백 | `toast.success('저장되었습니다.')` (react-hot-toast) |
| 오류 피드백 | `toast.error('오류 메시지')` |
| 로딩 상태 | 버튼 `disabled` + 텍스트 "처리 중..." |
| 빈 상태 | 아이콘 + 한 줄 안내 문구 |
| 삭제 버튼 색 | `--color-danger-bg` bg + `--color-danger` 텍스트 + `--color-danger` 1px border |
| 사이드바 활성 | bg `--color-sidebar-hover`, 텍스트 `--color-brand-400`, 좌 `3px solid --color-brand-500` |

---

## 10. 반응형

현재 어드민은 **데스크탑 우선** 설계. 1280px 이상을 기준으로 한다.

| 브레이크포인트 | 처리 |
|---|---|
| `≥ 1280px` | 사이드바 고정, 전체 레이아웃 |
| `768–1279px` | 사이드바 축소 (아이콘만) 또는 유지 |
| `< 768px`  | 사이드바 숨김, 햄버거 메뉴 (미구현 → Phase 5) |

---

## 11. 작업 규칙 요약

```
✅ DO
  - CSS 변수 (var(--...)) 로 색상·간격 참조
  - 비가역 작업에 useConfirm() 사용
  - 이미지는 ImgWithFallback 사용
  - 차트 fill/stroke에 hex 직접 지정
  - toast로 성공/오류 피드백

❌ DON'T
  - window.confirm() 사용 금지
  - 하드코딩 색상값 (hex/rgb) 직접 사용 금지 — 토큰 사용
  - 차트 fill에 CSS 변수 사용 금지
  - Sidebar.css 외 새 CSS 파일 생성 자제 — global.css 확장
  - 아이콘 이모지 사용 금지 — lucide-react 아이콘 사용
```

---

*관련 문서:*
- `DESIGN_ROADMAP.md` — 단계별 구현 계획
- `DESIGN_SPEC.md` — 상세 컴포넌트 스펙 (시니어 디자이너 산출물)
- `PRODUCT_SPEC.md` — 기능·엔티티 기획 (시니어 PM 산출물)
- `frontend/src/styles/tokens.css` — CSS 변수 원본

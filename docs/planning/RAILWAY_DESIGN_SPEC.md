# Happiness Admin — Railway 디자인 리뉴얼 기획서

> 작성일: 2026-07-01  
> 참고 레퍼런스: railway.com  
> 목적: 현재 Pinterest × Cosmos 퓨전 디자인을 Railway 스타일로 리뉴얼하여 개발자 친화적·프로페셔널 대시보드로 전환

---

## 1. Railway 디자인 DNA 분석

Railway는 개발자 인프라 플랫폼으로, **극도로 절제된 다크 UI** + **기능 중심의 정보 밀도**를 핵심 설계 철학으로 삼는다.

### 1.1 색상 팔레트

```
배경     #0B0D0E   ← 거의 순수 검정 (Cosmos보다 어두움)
서피스   #161B22   ← 카드/패널 배경
서피스2  #1F2329   ← 입력창, 호버 상태
보더     #2D3139   ← 아주 낮은 대비 테두리
보더2    #3D4450   ← 강조 테두리

텍스트1  #F5F5F5   ← 제목, 강조
텍스트2  #9BA3AF   ← 부제목, 설명
텍스트3  #4B5563   ← 힌트, 비활성

브랜드   #7C3AED   ← Violet (Railway 핵심 컬러)
브랜드2  #A78BFA   ← 밝은 Violet (호버, 강조)
브랜드BG #2D1B69   ← Violet 배경 (아주 어두운)

성공     #10B981   green-500
경고     #F59E0B   amber-500
오류     #EF4444   red-500
정보     #3B82F6   blue-500

빌드중   #F59E0B   (Building)
배포중   #A78BFA   (Deploying)
성공     #10B981   (Success)
실패     #EF4444   (Failed)
```

### 1.2 타이포그래피

| 역할 | 폰트 | 크기 | 굵기 |
|---|---|---|---|
| 페이지 타이틀 | Inter | 20px | 600 |
| 섹션 헤더 | Inter | 14px | 600 |
| 본문 | Inter | 13px | 400 |
| 메타/힌트 | Inter | 11px | 400 |
| 코드/로그 | `JetBrains Mono` | 12px | 400 |

### 1.3 핵심 레이아웃 구조

```
┌──────────────────────────────────────────────────────────┐
│  ■ Happiness Admin          [검색 Cmd+K]    [프로필]     │  ← 탑바 (56px)
├──────┬───────────────────────────────────────────────────┤
│      │                                                    │
│  사  │            메인 컨텐츠 영역                        │
│  이  │                                                    │
│  드  │  ┌─────────────────────────────────────────┐      │
│  바  │  │  브레드크럼 네비게이션                    │      │
│      │  │  페이지 제목 + 액션 버튼                 │      │
│  64px│  │                                         │      │
│  →   │  │  KPI 카드 / 테이블 / 차트               │      │
│  240px  │                                         │      │
│      │  └─────────────────────────────────────────┘      │
└──────┴───────────────────────────────────────────────────┘
```

### 1.4 사이드바 패턴

- **닫힘**: 64px — 아이콘만 표시, 툴팁으로 레이블
- **열림**: 240px — 아이콘 + 텍스트
- **활성 아이템**: 좌측 2px 보더 + 밝은 배경 (`--color-brand-bg`)
- **그룹 헤더**: 대문자 11px, 텍스트3 색상 (`MANAGEMENT`, `CONTENT`, `SYSTEM`)
- **하단 고정**: 시스템 상태, 프로필, 설정

### 1.5 카드 / 서비스 블록 패턴

Railway의 프로젝트 카드는 단순히 박스가 아닌 **상태(Status)가 살아있는 블록**이다.

```
┌─────────────────────────────────┐
│  ● [초록 dot]  서비스명          │  ← 상태 인디케이터
│  last deployed 2m ago            │  ← 타임스탬프
│  ──────────────────────────────  │
│  CPU  ▓▓▓░░░  12%               │  ← 미니 메트릭
│  MEM  ▓▓░░░░   8%               │
│  [View Logs]  [Settings]         │  ← 인라인 액션
└─────────────────────────────────┘
```

### 1.6 Railway 고유 UI 컴포넌트

| 컴포넌트 | 특징 |
|---|---|
| **Command Palette** | `Cmd+K` 전역 검색/실행 팝업, 어두운 배경 + 텍스트 필터 |
| **Activity Feed** | 배포 이벤트 타임라인, 모노스페이스 텍스트 |
| **Log Viewer** | 터미널 스타일, 검정 배경, 그린/화이트 텍스트 |
| **Status Dot** | 6px 원, 실시간 pulse 애니메이션 (활성 상태) |
| **Metric Graph** | 미니멀 라인 차트, 서피스 배경, 낮은 대비 그리드 |
| **Badge/Chip** | 1px 보더 + 반투명 배경, pill 형태 |
| **Empty State** | 중앙 정렬, 아이콘 + 텍스트 + CTA, 여백 충분 |

---

## 2. Happiness Admin 적용 계획

### 2.1 디자인 전환 방향

| 요소 | 현재 (Pinterest×Cosmos) | 변경 후 (Railway 영감) |
|---|---|---|
| 배경색 | `#FAFAF8` (크림 화이트) | `#0B0D0E` (딥 블랙) — **다크 전용** |
| 브랜드 컬러 | `#E60023` (Pin Red) | `#7C3AED` (Violet) |
| 카드 스타일 | 크림 배경 + 그림자 | 다크 서피스 + 얇은 보더 |
| 사이드바 | 240px 고정, 색상 강조 | 64↔240px 토글, 아이콘 중심 |
| 타이포 | Pretendard Variable | Inter + JetBrains Mono (로그) |
| 탑바 | 없음(사이드바만) | 56px 탑바 (검색 + 프로필) |
| 상태 표현 | 배지(텍스트) | 상태 Dot + 텍스트 병행 |

> **중요**: 라이트/다크 토글은 유지하되, 다크 모드가 Railway DNA, 라이트는 현재 Pinterest DNA 유지

### 2.2 CSS 변수 확장 계획

기존 CSS 변수 시스템을 **유지**하고 다크 모드 값만 Railway 팔레트로 교체한다.

```css
/* 다크 모드 — Railway DNA로 교체 */
[data-theme="dark"] {
  --color-bg:          #0B0D0E;
  --color-surface:     #161B22;
  --color-surface-2:   #1F2329;
  --color-border:      #2D3139;
  --color-border-light:#3D4450;

  --color-text-primary:   #F5F5F5;
  --color-text-secondary: #9BA3AF;
  --color-text-tertiary:  #4B5563;

  --color-brand:       #7C3AED;
  --color-brand-50:    #2D1B69;
  --color-brand-100:   #3D2B7A;

  --color-success:     #10B981;
  --color-success-bg:  #064E3B;
  --color-warning:     #F59E0B;
  --color-warning-bg:  #451A03;
  --color-danger:      #EF4444;
  --color-danger-bg:   #450A0A;
  --color-info:        #3B82F6;
  --color-info-bg:     #1E3A5F;
}

/* 추가 변수 (Railway 전용) */
:root {
  --color-status-active:   #10B981;
  --color-status-building: #F59E0B;
  --color-status-deploy:   #A78BFA;
  --color-status-error:    #EF4444;
  --color-status-idle:     #4B5563;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}
```

---

## 3. 페이지별 리뉴얼 설계

### 3.1 레이아웃 (`AdminLayout`)

**현재**: 좌측 240px 고정 사이드바  
**변경**: 56px 탑바 + 64↔240px 토글 사이드바

```
변경 전:
[사이드바 240px] [메인 콘텐츠]

변경 후:
[탑바 56px — 전체 폭]
[사이드바 64/240px] [메인 콘텐츠]
```

**탑바 구성**:
```
■ Happiness     [  🔍 검색... Cmd+K  ]          [● Live]  [👤]
```
- 좌: 로고 + 햄버거(사이드바 토글)
- 중: 글로벌 검색바 (Command Palette 트리거)
- 우: 시스템 상태 dot + 관리자 프로필 드롭다운

**사이드바 변경**:
```
[닫힘 64px]          [열림 240px]
┌──────┐             ┌──────────────────┐
│  ⊞   │             │  ⊞  대시보드      │
│  👥  │             │  👥  회원 관리    │
│  📷  │             │  📷  사진 관리    │
│  ──  │             │  ──  ──────────  │
│  📊  │             │  📊  통계         │
│  ⚙️  │             │  ⚙️  시스템        │
└──────┘             └──────────────────┘
```

### 3.2 대시보드 (`DashboardPage`)

**현재**: 6개 KPI 카드 + 바 차트 + 캘린더 + 테이블  
**변경**: Railway식 서비스 상태 블록 + 미니 메트릭

```
┌─────────────────────────────────────────────────────┐
│  ● 시스템 정상   마지막 동기화: 2분 전               │  ← 상태 배너
├──────────┬──────────┬──────────┬────────────────────┤
│  👥 회원  │  📷 사진  │  📬 문의  │  📅 오늘 예약       │  ← KPI (4열)
│  1,234   │  4,567   │   12     │     3              │
│  ↑ +5    │  ↑ +23   │  🔴 3 미읽│  ⏳ 2 미확정        │
├──────────┴──────────┴──────────┴────────────────────┤
│  최근 7일 업로드 추이 (라인 차트)      인기 사진 TOP5 │
├─────────────────────────────────────────────────────┤
│  이번 주 예약 캘린더 (미니)                           │
├─────────────────────────────────────────────────────┤
│  최근 활동 피드 (Railway Activity Feed 스타일)        │
│  ● 문의 #45 — 새 문의 도착          3분 전           │
│  ● 포트폴리오 #12 — 승인 완료       15분 전          │
│  ● 회원 kim@test.com — 가입         1시간 전         │
└─────────────────────────────────────────────────────┘
```

**새 컴포넌트**: `ActivityFeed` — Railway의 배포 로그 스타일  
- 이벤트 타입별 컬러 dot
- 모노스페이스 폰트로 세부 정보
- 실시간 업데이트 (폴링 30s)

### 3.3 KPI 카드 리뉴얼

```
현재:
┌─────────────────────────┐
│ 👥 [보라 배경 아이콘]    │
│ 1,234                   │
│ 전체 회원                │
└─────────────────────────┘

변경 후 (Railway):
┌─────────────────────────┐
│ 전체 회원                │  ← 레이블 상단
│ 1,234                   │  ← 큰 수치
│ ↑ 5  지난 7일           │  ← 변화율 인디케이터
│ ──────────────────       │
│ ▓▓▓▓▓░░░░░   65%        │  ← 미니 프로그레스
└─────────────────────────┘
```

### 3.4 회원 목록 (`MemberListPage`)

**현재**: 기본 테이블  
**변경**: Railway 서비스 리스트 스타일

```
필터 탭: [전체] [활성] [정지] [작가] [관리자]
                                    [+ 검색]

┌─────────────────────────────────────────────┐
│  ● kim@test.com          작가    가입 3일 전 │  ← 상태 dot
│    김민준 · 사진 23장 · 포트폴리오 2개       │
│    [상세보기]  [역할변경]  [정지]  [삭제]    │
├─────────────────────────────────────────────┤
│  ● park@test.com         회원    가입 15일   │
│    박지수 · 사진 0장                         │
└─────────────────────────────────────────────┘
```

### 3.5 로그 뷰어 스타일 도입

문의 상세, 시스템 상태에 **Railway 터미널 로그 뷰어** 스타일 적용:

```css
.log-viewer {
  background: #000000;
  font-family: var(--font-mono);
  font-size: 12px;
  color: #E5E7EB;
  padding: 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  overflow-y: auto;
  max-height: 400px;
}
.log-line-time  { color: #4B5563; }
.log-line-info  { color: #3B82F6; }
.log-line-warn  { color: #F59E0B; }
.log-line-error { color: #EF4444; }
.log-line-ok    { color: #10B981; }
```

### 3.6 Command Palette (`Cmd+K`)

Railway의 핵심 UX인 커맨드 팔레트를 어드민에 도입.

```
[ Cmd+K ]
┌──────────────────────────────────────┐
│  🔍 검색하거나 실행할 작업을 입력...   │
├──────────────────────────────────────┤
│  최근 방문                             │
│  → 회원 목록                           │
│  → 포트폴리오 심사                     │
│                                       │
│  바로가기                              │
│  ⊞ 대시보드                           │
│  👥 회원 관리                          │
│  📷 사진 관리                          │
│  📬 문의 관리                          │
└──────────────────────────────────────┘
```

**구현**: `useCommandPalette` 훅 + `CommandPalette.jsx` 공통 컴포넌트

### 3.7 상태 Dot 컴포넌트

Railway의 상태 인디케이터를 어드민 전반에 적용:

```jsx
// StatusDot.jsx
const STATUS = {
  active:   { color: 'var(--color-success)',  pulse: true  },
  building: { color: 'var(--color-warning)',  pulse: true  },
  error:    { color: 'var(--color-danger)',   pulse: false },
  idle:     { color: 'var(--color-status-idle)', pulse: false },
};
```

```css
.status-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.status-dot--pulse {
  animation: pulse-ring 2s ease-out infinite;
}
@keyframes pulse-ring {
  0%   { box-shadow: 0 0 0 0 currentColor; opacity: 0.8; }
  70%  { box-shadow: 0 0 0 6px transparent; opacity: 0; }
  100% { box-shadow: 0 0 0 0 transparent; }
}
```

---

## 4. 새로운 공통 컴포넌트 목록

| 컴포넌트 | 경로 | 설명 |
|---|---|---|
| `CommandPalette` | `components/common/CommandPalette.jsx` | Cmd+K 전역 검색 |
| `StatusDot` | `components/common/StatusDot.jsx` | 상태 인디케이터 dot |
| `ActivityFeed` | `components/dashboard/ActivityFeed.jsx` | 실시간 활동 피드 |
| `MiniMetric` | `components/common/MiniMetric.jsx` | 미니 프로그레스 바 |
| `LogViewer` | `components/common/LogViewer.jsx` | 터미널 스타일 로그 |
| `AdminTopbar` | `components/layout/AdminTopbar.jsx` | 상단 56px 바 |

---

## 5. 구현 우선순위 및 예상 작업량

| 순서 | 작업 | 난이도 | 예상 시간 |
|---|---|---|---|
| 1 | CSS 변수 다크 모드 값 Railway 팔레트로 교체 | ⭐ | 1h |
| 2 | `AdminTopbar` 컴포넌트 + 사이드바 토글 | ⭐⭐ | 3h |
| 3 | `StatusDot` 컴포넌트 + 펄스 애니메이션 | ⭐ | 1h |
| 4 | KPI 카드 리뉴얼 (미니 프로그레스 추가) | ⭐⭐ | 2h |
| 5 | `ActivityFeed` 컴포넌트 (대시보드) | ⭐⭐ | 2h |
| 6 | `CommandPalette` (Cmd+K) | ⭐⭐⭐ | 4h |
| 7 | 회원 목록 Railway 리스트 스타일 | ⭐⭐ | 2h |
| 8 | `LogViewer` 시스템 페이지 적용 | ⭐ | 1h |

**전체 예상**: 16h

---

## 6. 유지할 것 vs 바꿀 것

### 유지
- CSS 변수 기반 설계 (단, 다크 모드 값 교체)
- 라이트 모드 Pinterest DNA (라이트 사용자를 위해)
- 기존 기능 (`Pagination`, `SlideOver`, `useDragSort`)
- React SPA 구조, 라우팅

### 교체
- 사이드바 → 토글형 (64/240px)
- 탑바 신규 추가
- 카드 스타일 → 다크 서피스 + 얇은 보더
- 브랜드 컬러 (다크 모드) → Violet
- Pretendard → Inter (다크 모드) / 로그에 JetBrains Mono

### 신규 추가
- Command Palette
- Status Dot + Pulse 애니메이션
- Activity Feed
- 미니 메트릭 바 (KPI 카드 내)

---

## 7. 참고 스크린 설계 (ASCII)

### 대시보드 — Railway DNA 다크 모드

```
┌──────────────────────────────────────────────────────────────────────┐
│ ■ Happiness Admin    [  🔍 페이지, 회원, 기능 검색... Cmd+K      ]  👤 │
├───────┬──────────────────────────────────────────────────────────────┤
│       │  대시보드                                    2026-07-01      │
│  ⊞    │                                                              │
│  👥   │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  📷   │  │ 전체회원  │ │ 전체사진  │ │  미읽문의 │ │ 오늘예약  │       │
│  📬   │  │  1,234   │ │  4,567   │ │   12     │ │    3     │       │
│  📅   │  │ ↑5 7일   │ │ ↑23 7일  │ │ 🔴 미읽  │ │ ⏳ 2대기  │       │
│  ───  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│  📊   │                                                              │
│  🔧   │  ┌──────────────────────────┐ ┌─────────────────────────┐   │
│  ⚙️   │  │  7일 업로드 추이          │ │  인기 사진 TOP 5         │   │
│       │  │  ～～～                   │ │  #1 석양 노을 ❤ 234     │   │
│       │  │                          │ │  #2 한강 야경 ❤ 198     │   │
│       │  └──────────────────────────┘ └─────────────────────────┘   │
│       │                                                              │
│       │  ┌──────────────────────────────────────────────────────┐   │
│       │  │  최근 활동                                             │   │
│       │  │  ● 문의 #45 — hong@test.com → 작가 김민준    3분 전   │   │
│       │  │  ● 포트폴리오 #12 승인됨                   15분 전   │   │
│       │  │  ● 회원 park@test.com 신규 가입             1시간 전  │   │
│       │  └──────────────────────────────────────────────────────┘   │
└───────┴──────────────────────────────────────────────────────────────┘
```

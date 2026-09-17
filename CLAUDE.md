# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Happiness Admin is a full-stack admin dashboard with a **Spring Boot backend** (port 8081) and a **React frontend** (port 3000, CRA default — no `PORT` override in `package.json`). The backend uses H2 in-memory database for development.

## Commands

### Backend (Gradle)

```bash
cd backend

# Build (skip tests)
./gradlew clean build -x test

# Build with tests
./gradlew clean build

# Run dev server
./gradlew bootRun

# Run all tests
./gradlew test

# Run a specific test class
./gradlew test --tests "com.happiness.admin.controller.AdminHelloControllerTest"

# Run a specific test method
./gradlew test --tests "com.happiness.admin.controller.AdminHelloControllerTest.hello_returnsSuccessResponse"
```

### Frontend (npm)

```bash
cd frontend

npm install          # Install dependencies
npm start            # Dev server (port 3000)
npm run build        # Production build
npm test             # Run tests
npx eslint src/      # Lint
npx eslint src/ --fix  # Auto-fix lint
```

## Architecture

### Backend (`backend/src/main/java/com/happiness/admin/`)

Standard layered Spring Boot architecture:

- **`controller/`** — REST endpoints. Auth: `AuthController`/`AdminAuthController` (`/api/auth/login` → JWT 발급). Admin (모두 `/api/admin/**`, `ROLE_WM`/`ROLE_SA` 필요):
  - `AdminStatsController` — 대시보드 통계
  - `AdminMemberController` — 회원 목록/상세/역할 변경/상태 변경(정지·해제)/삭제
  - `AdminPhotoController` — 사진 목록/삭제/카테고리코드 수정
  - `AdminInquiryController` — 문의 목록(receiverId·senderId 필터)/읽음 처리/삭제
  - `AdminSeriesController` — 시리즈 목록/삭제
  - `AdminPortfolioController` — 포트폴리오 목록/승인/반려/비공개/삭제
  - `AdminCategoryController` — 사진 카테고리 트리 조회
  - `AdminSortController` — 정렬 관리 (`GET/PUT /sort/photos`, `/sort/series`, `/sort/series/:id/photos`, `/sort/portfolios/:id/items`)
  - `AdminSystemController` — 시스템 상태, 활동 로그/히트맵, Gemini 연동 상태·테스트(`/gemini-test`)
  - `AdminReportController` — 신고 목록/상세/처리, AI 트리아지 실행(`/ai-triage/run`, §AI 연동 참고)
  - `AdminNoticeController` — 공지사항 CRUD(임시저장/발행/종료)
  - `AdminBannerController` — 배너 관리
  - `AdminPopupController`/`PopupApiController` — 관리자용 팝업 CRUD·정렬 / 앱 노출용 활성 팝업 조회
  - `AdminFeaturedController` — 피처드 항목 관리
  - `AdminVerificationController` — 작가 인증 신청 검토
  - `AdminBookingController` — 촬영 예약 관리
  - `AdminContentPolicyController` — 정렬 가중치·유지보수 모드 설정
  - `AdminHelloController` — 헬스체크용 샘플 엔드포인트
- **`service/`** — `AuthService`, `MemberService`, `AdminStatsService`, `AdminMemberService`, `AdminPhotoService`, `AdminInquiryService`, `AdminSeriesService`, `AdminPortfolioService`, `AdminCategoryService`, `AdminSortService`, `AdminReportService`, `AdminReportAiTriageService`+`ReportAiTriageWriter`(§AI 연동), `AdminNoticeService`, `AdminBannerService`, `AdminPopupService`, `AdminFeaturedService`, `AdminVerificationService`, `AdminBookingService`, `AdminContentPolicyService`, `GeminiClientService`(§AI 연동).
- **`repository/`** — Spring Data JPA: `MemberRepository`, `PhotoRepository`, `InquiryRepository`, `SeriesRepository`, `SeriesPhotoRepository`, `PortfolioRepository`, `PortfolioItemRepository`, `PhotoCategoryRepository`, `ReportRepository`, `NoticeRepository`, `BannerRepository`, `PopupRepository`, `FeaturedItemRepository`, `VerificationRequestRepository`, `BookingRepository`, `SystemConfigRepository`, `AdminActivityLogRepository`.
  **주의**: `BoardRepository`/`ContentRepository`(및 `Board`/`Content` 엔티티)는 어떤 컨트롤러·서비스에서도 참조되지 않는 죽은 코드다 — 실제 게시판 기능은 없다(확인 필요 시 grep으로 재검증할 것, 새 기능을 여기 얹지 말 것).
- **`entity/`** — `Member` (suspendReason·suspendUntil·isVerified 포함), `Photo` (displayOrder), `Inquiry`(+`InquiryProcessStatus`), `Series` (displayOrder), `SeriesPhoto` (displayOrder), `Portfolio`, `PortfolioItem` (displayOrder), `PhotoCategory`, `Report`(aiSummary·aiSeverity·aiSuggestedAction·aiAnalyzedAt 포함, §AI 연동), `Notice`, `Banner`, `Popup`, `FeaturedItem`, `VerificationRequest`, `Booking`(+`BookingStatus`), `SystemConfig`, `AdminActivityLog`, `Authority` (WM/SA/US), `MemberStatus`, `PortfolioStatus`, `PortfolioVisibility`.
- **`security/`** — `JwtTokenProvider`, `JwtAuthenticationFilter` (Bearer 토큰 검증). 모든 `/api/admin/**`는 `ROLE_WM` 또는 `ROLE_SA` 필요.
- **`dto/`** — `LoginResponse`, `PageResponse<T>`, `AdminMemberDto` (portfolioCount 포함), `AdminPhotoDto`, `AdminInquiryDto`, `AdminSeriesDto`, `AdminPortfolioDto`, `StatsSummaryDto`, `DailyStatDto`, `TopPhotoDto`, `DistItemDto`, `SystemStatusDto`, `RoleUpdateRequest`, `StatusUpdateRequest`, `CategoryDto`, `ReorderItem`, `SortPhotoDto`, `SortSeriesDto`, `SortSeriesPhotoDto`, `SortPortfolioItemDto`.
- **`DataInitializer`** — `@Profile("!prod")`: 서버 기동 시 H2에 테스트 데이터 자동 삽입 (관리자 2명, 회원 10명, 사진 30장·displayOrder 1–30, 문의 15건, 시리즈 8개·displayOrder 1–8, 포트폴리오 6개). **개발 계정: `admin@happiness.dev` / `Admin123!`**

Key settings (`application.properties`):
- Server: `localhost:8081`
- H2 console: `localhost:8081/h2-console` (JDBC URL: `jdbc:h2:mem:happinessadmindb`)
- DDL: `create-drop` (schema recreated on every restart)
- JWT: `jwt.secret`, `jwt.expiration` (env 또는 dev 기본값 사용)

### Frontend (`frontend/src/`)

React SPA using React Router v6 + Recharts:

- **`context/AuthContext.jsx`** — JWT 저장/조회/삭제, `useAuth()` 훅 제공
- **`context/ConfirmContext.jsx`** — 전역 확인 다이얼로그, `useConfirm()` 훅 제공
- **`pages/`** —
  - `LoginPage` — JWT 로그인 (앱 전체 다크모드와 무관하게 항상 라이트 고정)
  - `DashboardPage` — KPI 카드(brand/accent/info/warning/danger 토큰) + 심사 대기 포트폴리오 + 활동 피드 + 예약 캘린더
  - `MemberListPage` — 회원 목록/검색/상태 필터/역할 변경/정지/삭제
  - `MemberDetailPage` — 회원 상세·KPI·탭(사진·시리즈·문의)·정지 모달
  - `PhotoListPage` — 사진 목록/필터/삭제
  - `InquiryListPage` — 문의 목록/읽음 처리/처리상태 관리
  - `SeriesListPage` — 시리즈 목록/삭제/사진 정렬 링크
  - `PortfolioListPage` — 포트폴리오 목록/슬라이드오버 심사·승인·반려/아이템 정렬 링크
  - `SortPhotosPage` (`/sort/photos`) — 전체 사진 드래그 정렬
  - `SortSeriesPage` (`/sort/series`) — 전체 시리즈 드래그 정렬
  - `SortSeriesDetailPage` (`/sort/series/:id`) — 시리즈별 사진 순서 정렬
  - `SortPortfolioPage` (`/sort/portfolios/:id`) — 포트폴리오별 아이템 순서 정렬
  - `StatsPage` — 꺾은선/파이/바 차트
  - `SystemPage` — 시스템 상태, 활동 히트맵·로그, Gemini 연동 테스트(§AI 연동)
  - `ReportListPage` — 신고 목록/검토 모달, AI 트리아지 요약·심각도 배지(§AI 연동)
  - `NoticePage` (`/notices`) — 공지사항 게시판 CRUD(임시저장/발행/종료, 상단 고정)
  - `BannerPage` (`/banners`) — 배너 관리
  - `PopupPage` (`/popups`) — 팝업 관리·정렬
  - `FeaturedPage` (`/featured`) — 피처드 항목 관리
  - `VerificationListPage` (`/verifications`) — 작가 인증 신청 검토
  - `BookingListPage` (`/bookings`) — 촬영 예약 관리
  - `ContentPolicyPage` (`/content-policy`) — 정렬 가중치·유지보수 모드 설정
- **`components/layout/`** — `Sidebar` (정렬 관리 아코디언 포함), `AdminLayout`, `AdminTopbar` (검색바·다크모드 토글·프로필 드롭다운 — `AdminHeader`는 더 이상 존재하지 않는다, Toss 리뉴얼 때 교체됨)
- **`components/common/`** — `Pagination`, `ConfirmDialog`, `SlideOver`, `ImgWithFallback`
- **`hooks/useDragSort.js`** — HTML5 DnD 기반 정렬 훅. `toReorderPayload()` 로 `[{id, displayOrder}]` 생성
- **`utils/api.js`** — `getApi`, `postApi`, `patchApi`, `putApi`, `deleteApi`. **토큰이 실려 있던 요청**의 401만 세션 만료로 간주해 `/login` 강제 리다이렉트한다 — 토큰 없이 보낸 요청(로그인 자체 등)의 401은 그 자체가 인증 실패 응답이라 일반 에러로 넘긴다. 이전에는 이 구분이 없어서 로그인 실패 메시지가 아예 안 뜨는 버그가 있었다(수정됨).
- **`App.jsx`** — `ProtectedRoute` 래퍼: 미인증 시 `/login`으로 리다이렉트

## AI 연동

두 개의 독립된 LLM 연동이 있다 — 서로 대체 관계가 아니라 용도가 다르다.

| | Claude API | Gemini API |
|---|---|---|
| **용도** | 신고 트리아지(`AdminReportAiTriageService`) — 신고 요약·심각도·참고용 조치 제안 | 범용 텍스트 생성(`GeminiClientService.generateText(prompt)`) — 특정 기능에 종속 안 됨 |
| **env var** | `ANTHROPIC_API_KEY` | `GEMINI_API_KEY` (모델은 `GEMINI_MODEL`, 기본 `gemini-3.6-flash`) |
| **호출 시점** | 관리자가 신고 목록에서 "AI 분석 실행" 클릭 시 온디맨드(최대 20건, 미분석 건만) | 호출하는 기능이 필요할 때마다(현재는 `/system` 페이지 테스트 버튼만 실사용) |
| **키 없을 때** | 서버 기동 실패 안 함, 호출 시점에만 실패 | 동일 |

**AI-사람 경계선(신고 트리아지)**: AI는 요약·심각도·참고용 조치까지만 하고, 실제 상태 전환(`AdminReportController`의 `/process`)은 항상 관리자가 검토 모달에서 직접 클릭해야만 실행된다 — AI 호출 경로와 실제 조치 실행 경로는 완전히 분리돼 있다. 배경/설계 근거는 `docs/planning/AX_REPORT_TRIAGE_PLAN.md` 참고.

두 클라이언트 모두 새 라이브러리를 추가하지 않았다 — Claude는 공식 Java SDK(`anthropic-java`), Gemini는 JDK 내장 `java.net.http.HttpClient` + 기존 Jackson으로 직접 REST 호출.

## 자동화 · MCP · 스킬

- **`happiness-admin-mcp-server/`** — Node/TypeScript MCP 서버(stdio). 읽기 전용 도구(`happiness_admin_get_dashboard_summary`, `_list_reports`, `_list_members`) + AI 트리아지 트리거(`_run_report_ai_triage`)만 제공한다 — 회원 정지·삭제 같은 조치성 API는 의도적으로 노출하지 않음(실제 조치는 항상 Admin UI에서 사람이). `HAPPINESS_ADMIN_EMAIL`/`_PASSWORD`로 백엔드에 로그인해 JWT를 내부적으로 관리한다. 상세: `happiness-admin-mcp-server/README.md`.
- **`.claude/hooks/notify-page-change.sh`** (Stop 훅) — `frontend/src/pages/**/*.jsx|css`가 바뀐 채로 턴이 끝나면 멈추지 않고 "agent-browser로 스크린샷 찍고 Gmail로 알려라"는 지시를 다시 넣는다. 같은 미완료 변경은 diff 해시 마커(`.claude/.page-change-notify-marker`, gitignore 처리)로 중복 알림 방지.
- **`scripts/qa-check.sh`** — agent-browser로 로그인 후 전체 라우트를 순회하며 콘솔 에러·5xx·스크린샷을 점검. 새 라우트를 추가하면 이 스크립트의 `ROUTES` 배열도 수동으로 같이 갱신해야 한다(자동 동기화 안 됨).
- **`scripts/notion-screens-capture.sh`** — 전체 화면 스크린샷을 찍어 Notion 문서화용으로 캡처(`docs/screens/`에 512px 썸네일 커밋 후 raw.githubusercontent.com URL을 Notion 페이지 커버로 사용 — Notion 파일 업로드 API가 이 샌드박스 네트워크 정책상 막혀 있을 때 쓴 우회로).
- **`.claude/skills/`** — 프로젝트 전용(`design`, `grill-me`, `qa-admin-routes`) + 외부에서 설치한 것(`agent-browser`, `find-skills`, `mcp-builder`, `design-taste-frontend`, `web-design-guidelines`). `design`은 Working Rule 5에 따라 모든 UI 작업에 필수, `design-taste-frontend`는 랜딩/포트폴리오형 화면에만 선별 적용(대시보드류엔 스킬 자체가 안 맞는다고 명시함).
- **`claude-md-management` 플러그인**(user scope, `~/.claude/settings.json`) — `claude-md-improver` 스킬로 이 파일을 주기적으로 감사할 수 있다.

## Design System

### Design References

현재(6차) 디자인 컨셉은 **Toss** — 흰 캔버스 위 파랑 하나, 둥근 모서리와 소프트 섀도우로
신뢰감을 만드는 절제된 금융 UI 문법이다. 1~5차(Cosmos × Pinterest → Railway DNA →
Pixel Arcade → 和ドット → AKIRA Neo-Tokyo)는 전부 폐기되었다 — 관련 기록 문서는 더 이상
리포지토리에 없다(과거 세대의 팔레트·컴포넌트 디테일이 필요하면 git 히스토리 참고). 5차
AKIRA의 각진 프레임·하드 오프셋 섀도우·네온 포인트·CRT 텍스처는 전부 폐기했다 — 6차는
톤 전환이 아니라 구조 자체의 전환이다.

| DNA | Key Elements |
|---|---|
| **둥근 카드** | 둥근 모서리(`--radius-sm` 8px ~ `--radius-2xl` 24px), 소프트 엘리베이션 섀도우(`--shadow-ring`), 하드 오프셋 없음 |
| **Toss 팔레트** | 파랑(#3182F6) 브랜드, sky(#0EA5E9) 보조 액센트, 라이트/다크 모두 옅은 회색 보더 유지(반전 없음) |
| **인터랙션** | 클릭 시 `scale(0.97)` 스퀴시, hover 시 `filter: brightness(0.96)` 또는 소프트 리프트 — 하드 오프셋/픽셀 블링크 없음 |

### CSS Variable System

모든 색상은 CSS 변수 단일 인터페이스를 통해 light/dark 자동 전환된다. **실제 존재하는
토큰만 사용할 것** — `--color-text`, `--color-text-2` 같은 이름은 정의되어 있지 않다
(과거 이 문서에 잘못 기재되어 있었고, 상속으로 우연히 렌더링되던 잠재 버그의 원인이었다).

```css
/* frontend/src/styles/tokens.css 실제 정의 (발췌) */
:root {
  --color-bg:             #F2F4F6;  /* 밝은 회색 캔버스 (라이트) */
  --color-surface:        #FFFFFF;
  --color-border:         #E5E8EB;  /* 옅은 회색 라인 — 라이트/다크 모두 반전 없음 */
  --color-text-primary:   #191F28;
  --color-text-secondary: #4E5968;
  --color-text-tertiary:  #8B95A1;
  --color-brand:          #3182F6;  /* Toss Blue */
  --color-accent:         #0EA5E9;  /* sky, 보조 액센트 */
  --color-success/-warning/-danger/-info: ... /* 각각 -bg 페어 존재 */
  --font-pixel:  var(--font-sans);  /* 하위 호환용 별칭 — 전용 디스플레이 서체 없음 */
  --font-serif:  var(--font-sans);  /* 동일 */
  --shadow-ring: 0 1px 2px rgba(25,31,40,.04), 0 8px 20px rgba(25,31,40,.06); /* 소프트 엘리베이션 */
  --shadow-glow-red/-cyan: ...; /* 토큰명 유지, 값은 소프트 컬러 글로우로 교체 */
}

/* 다크모드: 반전하지 않는다 — 어둡게 톤만 낮추고 파랑 밝기만 올린다 */
[data-theme="dark"], @media (prefers-color-scheme: dark) {
  --color-bg:     #14181D;
  --color-border: #2C333D;  /* 다크에서도 여전히 "옅은" 회색 라인, 화이트 반전 없음 */
  --color-text-primary: #F2F4F6;
  --color-brand:  #4C8FFF;  /* 다크 배경에서 시인성 위해 살짝 밝게 */
  --color-accent: #38BDF8;
}
```

색상 이름·전체 팔레트는 `docs/design/TOSS_DESIGN_SPEC.md` 참고.

### Key Component Patterns

| Component | Pattern | Notes |
|---|---|---|
| **카드/테이블/모달** | `border: 1px solid var(--color-border)` + `box-shadow: var(--shadow-ring)` | 소프트 엘리베이션, 이중 프레임 아님 |
| **StatusDot** | `border-radius: var(--radius-full)` 원형 | 다이아몬드/사각 아님 |
| **Sidebar active** | 브랜드 블루로 채운 둥근 필박스 배경 + 흰 텍스트 | 화살표 커서(`▶`) 없음 |
| **버튼 클릭 피드백** | `transform: scale(0.97)` 스퀴시 | 하드 오프셋(`translate(2px,2px)`) 아님 |
| **로그인 화면** | 앱 전체와 동일한 라이트 팔레트, 로컬 스코프 변수(`--lp-*`)는 유지 | `pages/LoginPage.css` — "항상 다크 고정" 원칙은 폐기됨 |
| **Image blur reveal** | `filter: blur(4px) → blur(0)` on `onLoad` | `transition: filter 0.4s ease` (계승) |
| **Scroll entrance** | `IntersectionObserver` + `.visible`/`.kpi-visible` 클래스 | `opacity 0→1, translateY→0` — 트리거까지 최대 ~1초 소요될 수 있음(자동화 테스트 시 유의) |
| **SlideOver** | 우측 패널, 테두리 없이 `box-shadow: var(--shadow-xl)`만 | 좌측 이중선 프레임 폐기 |
| **Masonry grid** | `column-count` CSS (no JS) | 사진 목록 등 일부 페이지에서 유지 |

### Font

```html
<!-- Pretendard는 jsdelivr CDN 유지, 별도 디스플레이 서체(Google Fonts) 로드 없음 -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css" />
```

### Design Files

- `docs/design/TOSS_DESIGN_SPEC.md` — **현재(6차) 디자인 구현 기록** (팔레트·컴포넌트·적용 범위)
- `docs/planning/APP_TO_ADMIN_SPEC.md` — happiness-app에서 admin으로 이식할 기능 명세. **주의: 이 문서(2026-06-23자)는 이미 낡았다** — "신고/제재 미구현(P2)"라고 적혀 있지만 실제로는 `AdminReportController`/`ReportListPage`가 완전히 구현돼 있고 AI 트리아지까지 붙어 있다(§AI 연동). 이 문서의 구현 여부 표시를 그대로 믿지 말고 코드로 재확인할 것.
- `docs/planning/AX_REPORT_TRIAGE_PLAN.md` — 신고 트리아지 AI 어시스트 기획(위 AI 연동 섹션의 설계 근거)
- 그 외 `docs/planning/*.md` — 기능별 기획서 다수(배치 로직, 대시보드/통계 역할 재정의 등). 새 기획 작업 전에 관련 파일이 이미 있는지 먼저 확인할 것.

### Design Rules

1. **CSS 변수만 사용**: 하드코딩된 색상값 금지. 반드시 실제 존재하는 `var(--color-*)` 사용 —
   작업 전 `frontend/src/styles/tokens.css`에서 토큰명을 확인할 것(이 문서의 표기만 믿지 말 것).
2. **다크모드 기본 지원**: 새 컴포넌트는 CSS 변수 시스템에 따라 자동으로 양쪽 테마를 지원해야 한다.
   Toss는 라이트/다크 모두 "옅은 회색 보더" 원칙을 유지한다(반전 없음) — 하드코딩된 보더/배경
   조합을 피할 것.
3. **둥근 모서리 사용**: `border-radius`는 항상 `var(--radius-*)` 사용 — `0`으로 하드코딩하지 말 것.
4. **이미지 blur reveal**: 모든 이미지는 `onLoad`에서 blur → clear 전환 적용.
5. **IntersectionObserver 입장 애니메이션**: 카드 리스트 페이지에서 스크롤 진입 시 fade+slide up 적용.
6. **하드 오프셋 금지**: 버튼/카드 hover·active에 `translate(Npx,Npx)` 픽셀 오프셋을 새로
   추가하지 말 것 — hover는 `filter`/소프트 `box-shadow`, active는 `scale(0.97)` 스퀴시.
7. **패널은 `--shadow-ring`, 버튼은 `--shadow-sm/md`**: 정적 카드/모달과 클릭 가능한 버튼의
   섀도우 체계가 다르다 — 혼용하지 말 것.

## AI Roles

이 프로젝트는 아래 AI가 역할을 분담하여 협업한다.

| AI | 역할 | 주요 책임 |
|---|---|---|
| **Pomelli** | 기획 (Planning) | 요구사항 분석, 기능 정의, 화면 및 사용자 플로우 설계, 작업 우선순위 결정 |
| **Stitch** | 디자인 (Design) | UI/UX 디자인, 컴포넌트 구조 제안, 스타일 및 디자인 시스템 관리, 반응형 레이아웃 설계 |
| **AI Studio** | 자동화 (Automation) | 반복 작업 자동화, 스크립트 생성, 배포 및 워크플로우 자동화, 생산성 향상 도구 연동 |
| **Claude Code** | 구현 (Implementation) | 백엔드·프론트엔드 코드 작성, 빌드 검증, 커밋·푸시 |

### 협업 원칙

- 기획 변경 사항은 **Pomelli** 기준으로 작성한다.
- UI/UX 관련 사항은 **Stitch**의 결과를 우선 반영한다.
- 반복 작업 및 자동화는 **AI Studio**를 적극 활용한다.
- 코드 구현 시 위 역할을 참고하여 일관된 개발 프로세스를 유지한다.

## CI/CD

### GitHub Actions (`.github/workflows/ci.yml`)

| 항목 | 내용 |
|---|---|
| 트리거 | `push` → main, develop, `claude/**` / `pull_request` → main, develop |
| Backend 빌드 | Java 21 (Temurin) + Gradle 8.14.4 → `cd backend && ./gradlew build` |
| Frontend 빌드 | Node.js 20 → `npm ci` + `npm run build` |

### 배포 파이프라인 (`.github/workflows/deploy.yml`)

`master` 브랜치 push/PR에서만 동작 — ci.yml과 별개 워크플로. 백엔드는 Railway(Docker 이미지 빌드+push 후 배포, `RAILWAY_TOKEN` 필수, `RAILWAY_PROJECT_ID` 설정 시 happiness-app과 같은 프로젝트에 묶어 비용 절감), 프론트는 Vercel로 배포한다. `claude/**` 브랜치에서는 배포되지 않는다 — CI(ci.yml)만 돈다.

**환경 변수**

| 변수 | 값 | 용도 |
|---|---|---|
| `JWT_SECRET` | `ci-test-secret-key-at-least-256-bits-long-for-hs256-algorithm` | 백엔드 테스트용 JWT 시크릿 |
| `CI` | `false` | CRA ESLint 경고를 에러로 처리하지 않도록 설정 |

**주의사항**

- `backend/gradle.properties`에 `org.gradle.java.home` 을 절대 하드코딩하지 않는다. GitHub Actions 러너의 Java 경로는 `actions/setup-java`가 `JAVA_HOME`으로 자동 설정한다.
- 로컬에서 특정 JDK 경로를 지정해야 하는 경우 `~/.gradle/gradle.properties`(사용자 홈)에 설정하고 프로젝트 파일에는 커밋하지 않는다.

## Working Rules

1. **항상 기능 검증**: 코드 작성 후 반드시 백엔드는 `./gradlew build` + 서버 기동 후 API curl 테스트, 프론트엔드는 `npm run build` 로 빌드 성공을 확인한다.
2. **검증 완료 후 커밋·푸시**: 기능 검증이 통과된 경우에만 `git add → git commit → git push` 를 수행한다. 검증 실패 시 먼저 수정 후 재검증한다.
3. **기획 요청 시 전체 구현**: 기획(스펙 문서 작성)을 요청받으면 문서 작성에서 그치지 않고 백엔드·프론트엔드 개발과 디자인까지 end-to-end로 구현한다.
4. **푸시 전 빌드 필수**: `git push` 직전에 반드시 프론트엔드(`npm run build`)와 백엔드(`./gradlew build -x test`)를 모두 빌드하여 성공을 확인한다. ESLint 경고도 0개여야 한다. 빌드 실패 또는 경고가 있으면 수정 후 재빌드하고, 통과한 뒤에만 푸시한다.
5. **UI/디자인 작업은 `design` 스킬 필수 사용**: 새 컴포넌트·페이지 디자인, 기존 화면 리디자인, 스타일 방향 탐색 등 시각적 디자인이 관련된 모든 작업은 `.claude/skills/design/SKILL.md`(Stitch 디자이너 에이전트)를 통해 진행한다. 이 스킬 밖에서 즉흥적으로 HTML 목업이나 별도 아티팩트로 디자인 탐색을 하지 않는다 — `design` 스킬의 워크플로우(UNDERSTAND → PLAN → GENERATE → BUILD → **PREVIEW(Playwright 자가 검증, 생략 불가)** → ITERATE)를 항상 따른다.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend runtime | Java 25, Spring Boot 3.5 |
| Build tool | Gradle 8.14.4 |
| ORM | Spring Data JPA + Hibernate |
| Database (dev) | H2 in-memory |
| Security | Spring Security 6 |
| Testing | JUnit 5, MockMvc, Spring Security Test |
| Code gen | Lombok |
| Frontend | React 18, React Router DOM 6, Recharts 3 |
| Frontend tooling | Create React App (react-scripts 5) |
| Linting | ESLint 8 (`react-app` config) |

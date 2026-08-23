# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Happiness Admin is a full-stack admin dashboard with a **Spring Boot backend** (port 8081) and a **React frontend** (port 3001). The backend uses H2 in-memory database for development.

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
npm start            # Dev server (port 3001)
npm run build        # Production build
npm test             # Run tests
npx eslint src/      # Lint
npx eslint src/ --fix  # Auto-fix lint
```

## Architecture

### Backend (`backend/src/main/java/com/happiness/admin/`)

Standard layered Spring Boot architecture:

- **`controller/`** — REST endpoints. Auth: `AuthController` (`/api/auth/login` → JWT 발급). Admin (모두 `/api/admin/**`):
  - `AdminStatsController` — 대시보드 통계
  - `AdminMemberController` — 회원 목록/상세/역할 변경/상태 변경(정지·해제)/삭제
  - `AdminPhotoController` — 사진 목록/삭제/카테고리코드 수정
  - `AdminInquiryController` — 문의 목록(receiverId·senderId 필터)/읽음 처리/삭제
  - `AdminSeriesController` — 시리즈 목록/삭제
  - `AdminPortfolioController` — 포트폴리오 목록/승인/반려/비공개/삭제
  - `AdminCategoryController` — 사진 카테고리 트리 조회
  - `AdminSortController` — 정렬 관리 (`GET/PUT /sort/photos`, `/sort/series`, `/sort/series/:id/photos`, `/sort/portfolios/:id/items`)
  - `AdminSystemController` — 시스템 상태
- **`service/`** — `AuthService`, `MemberService`, `AdminStatsService`, `AdminMemberService`, `AdminPhotoService`, `AdminInquiryService`, `AdminSeriesService`, `AdminPortfolioService`, `AdminCategoryService`, `AdminSortService`.
- **`repository/`** — Spring Data JPA: `MemberRepository`, `PhotoRepository`, `InquiryRepository`, `SeriesRepository`, `SeriesPhotoRepository`, `PortfolioRepository`, `PortfolioItemRepository`, `PhotoCategoryRepository`, `BoardRepository`, `ContentRepository`.
- **`entity/`** — `Member` (suspendReason·suspendUntil·isVerified 포함), `Photo` (displayOrder), `Inquiry`, `Series` (displayOrder), `SeriesPhoto` (displayOrder), `Portfolio`, `PortfolioItem` (displayOrder), `PhotoCategory`, `Authority` (WM/SA/US), `MemberStatus`, `PortfolioStatus`, `PortfolioVisibility`.
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
  - `LoginPage` — JWT 로그인
  - `DashboardPage` — 요약 카드 + 바 차트
  - `MemberListPage` — 회원 목록/검색/상태 필터/역할 변경/정지/삭제
  - `MemberDetailPage` — 회원 상세·KPI·탭(사진·시리즈·문의)·정지 모달
  - `PhotoListPage` — 사진 목록/필터/삭제
  - `InquiryListPage` — 문의 목록/읽음 처리
  - `SeriesListPage` — 시리즈 목록/삭제/사진 정렬 링크
  - `PortfolioListPage` — 포트폴리오 목록/슬라이드오버 심사·승인·반려/아이템 정렬 링크
  - `SortPhotosPage` (`/sort/photos`) — 전체 사진 드래그 정렬
  - `SortSeriesPage` (`/sort/series`) — 전체 시리즈 드래그 정렬
  - `SortSeriesDetailPage` (`/sort/series/:id`) — 시리즈별 사진 순서 정렬
  - `SortPortfolioPage` (`/sort/portfolios/:id`) — 포트폴리오별 아이템 순서 정렬
  - `StatsPage` — 꺾은선/파이/바 차트
  - `SystemPage` — 시스템 상태
- **`components/layout/`** — `Sidebar` (정렬 관리 아코디언 포함), `AdminLayout`, `AdminHeader`
- **`components/common/`** — `Pagination`, `ConfirmDialog`, `SlideOver`, `ImgWithFallback`
- **`hooks/useDragSort.js`** — HTML5 DnD 기반 정렬 훅. `toReorderPayload()` 로 `[{id, displayOrder}]` 생성
- **`utils/api.js`** — `getApi`, `postApi`, `patchApi`, `putApi`, `deleteApi` (localStorage JWT 자동 첨부, 401 시 `/login` 리다이렉트)
- **`App.jsx`** — `ProtectedRoute` 래퍼: 미인증 시 `/login`으로 리다이렉트

## Design System

### Design References

현재(5차) 디자인 컨셉은 **AKIRA Neo-Tokyo** — 블랙/화이트 기반 + 레드·시안 포인트의
사이버펑크 포스터 × HUD 터미널 미학이다. 1~4차(Cosmos × Pinterest → Railway DNA →
Pixel Arcade → 和ドット/와도트)는 폐기되었다 — 관련 기록 문서는 더 이상 리포지토리에
없다(과거 세대의 팔레트·컴포넌트 디테일이 필요하면 git 히스토리 참고). 5차는 4차의
구조적 DNA(CSS 변수 단일 인터페이스, `radius:0`, 하드 오프셋 섀도우, 라이트/다크
보더-배경 명암 반전)를 그대로 계승하고 팔레트·타이포그래피만 교체한 톤 전환이다.

| DNA | Key Elements |
|---|---|
| **각진 프레임(계승)** | 각진 모서리(`radius:0`), 하드/이중 프레임(`--shadow-ring`), 하드 오프셋 버튼 섀도우 |
| **AKIRA Neo-Tokyo 팔레트** | 紅(#E8112D) 브랜드, 시안(#0097A7) 보조 액센트, 블랙(라이트 보더)/화이트(다크 보더) 반전, 다크 모드는 네온 채도 강화 |
| **시그니처 디테일(신규)** | 해저드 스트라이프(`--hazard-stripe`, 상단바), 네온 글로우(`--shadow-glow-red/-cyan`), CRT 스캔라인 배경(`--dot-grid`) |

### CSS Variable System

모든 색상은 CSS 변수 단일 인터페이스를 통해 light/dark 자동 전환된다. **실제 존재하는
토큰만 사용할 것** — `--color-text`, `--color-text-2` 같은 이름은 정의되어 있지 않다
(과거 이 문서에 잘못 기재되어 있었고, 상속으로 우연히 렌더링되던 잠재 버그의 원인이었다).

```css
/* frontend/src/styles/tokens.css 실제 정의 (발췌) */
:root {
  --color-bg:             #F4F4F4;  /* 화이트 베이스 (라이트) */
  --color-surface:        #FFFFFF;
  --color-border:         #0A0A0A;  /* 포스터 블랙 라인 */
  --color-text-primary:   #0A0A0A;
  --color-text-secondary: #3D3D3D;
  --color-text-tertiary:  #7A7A7A;
  --color-brand:          #E8112D;  /* AKIRA 레드 */
  --color-accent:         #0097A7;  /* Neo-Tokyo 시안 (보조 액센트) */
  --color-success/-warning/-danger/-info: ... /* 각각 -bg 페어 존재 */
  --font-pixel:  'Orbitron', ...;      /* 브랜드 로고·KPI 숫자 전용(한글 미지원) */
  --font-serif:  'Black Han Sans', ...; /* 페이지 타이틀 전용(볼드 포스터체) */
  --shadow-ring: 0 0 0 3px var(--color-bg), 0 0 0 5px var(--color-border); /* 이중 프레임 */
  --shadow-glow-red/-cyan: ...; /* CTA·활성 요소 네온 글로우 (신규) */
  --hazard-stripe: repeating-linear-gradient(-45deg, ...); /* 경고 스트라이프 (신규) */
}

/* 다크모드: 보더-배경 명암이 반전된다 (화이트 보더 위 블랙 배경, 네온 채도 강화) */
[data-theme="dark"], @media (prefers-color-scheme: dark) {
  --color-bg:     #0A0A0C;
  --color-border: #FFFFFF;  /* 다크 모드는 화이트 라인 */
  --color-text-primary: #FFFFFF;
  --color-brand:  #FF2D46;  /* 다크에서 더 밝은 네온 레드 */
  --color-accent: #00E5FF;  /* 다크에서 풀 네온 시안 */
}
```

색상 이름·전체 팔레트는 `docs/design/AKIRA_NEOTOKYO_DESIGN_SPEC.md` 참고.

### Key Component Patterns

| Component | Pattern | Notes |
|---|---|---|
| **카드/테이블/모달** | `border: 2px solid var(--color-border)` + `box-shadow: var(--shadow-ring)` | 블러 없는 이중 프레임 |
| **StatusDot** | `clip-path: polygon(...)` 다이아몬드 | 원형/사각 아님 |
| **Sidebar active** | `::before { content: '▶' }` | 좌측 바 아님 — 화살표 커서 |
| **버튼 클릭 피드백** | `translate(2px,2px)` + `box-shadow: none` | `--shadow-sm/md` 하드 오프셋 전용, 패널에는 미사용 |
| **로그인 화면** | 항상 다크 고정, 로컬 스코프 변수(`--lp-*`)로 테마 독립 | `pages/LoginPage.css` |
| **Image blur reveal** | `filter: blur(4px) → blur(0)` on `onLoad` | `transition: filter 0.4s ease` |
| **Scroll entrance** | `IntersectionObserver` + `.visible`/`.kpi-visible` 클래스 | `opacity 0→1, translateY→0` — 트리거까지 최대 ~1초 소요될 수 있음(자동화 테스트 시 유의) |
| **SlideOver** | 우측 패널, 좌측 엣지만 이중선 프레임 | `border-left` + 2겹 `box-shadow` |
| **Masonry grid** | `column-count` CSS (no JS) | 사진 목록 등 일부 페이지에서 유지 |

### Font

```html
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Black+Han+Sans&display=swap" rel="stylesheet" />
<!-- Pretendard는 기존 jsdelivr CDN 유지 -->
```

### Design Files

- `docs/design/AKIRA_NEOTOKYO_DESIGN_SPEC.md` — **현재(5차) 디자인 구현 기록** (팔레트·컴포넌트·적용 범위)
- `docs/planning/APP_TO_ADMIN_SPEC.md` — happiness-app에서 admin으로 이식할 기능 명세

### Design Rules

1. **CSS 변수만 사용**: 하드코딩된 색상값 금지. 반드시 실제 존재하는 `var(--color-*)` 사용 —
   작업 전 `frontend/src/styles/tokens.css`에서 토큰명을 확인할 것(이 문서의 표기만 믿지 말 것).
2. **다크모드 기본 지원**: 새 컴포넌트는 CSS 변수 시스템에 따라 자동으로 양쪽 테마를 지원해야 한다.
   보더-배경 명암이 테마마다 반전되므로(라이트=화이트 배경/블랙 보더, 다크=블랙 배경/화이트
   보더) 하드코딩된 보더/배경 조합을 피할 것.
3. **각진 모서리 유지**: `border-radius`를 새로 하드코딩하지 말 것 — `var(--radius-*)`는 전부 `0`.
4. **이미지 blur reveal**: 모든 이미지는 `onLoad`에서 blur → clear 전환 적용.
5. **IntersectionObserver 입장 애니메이션**: 카드 리스트 페이지에서 스크롤 진입 시 fade+slide up 적용.
6. **폰트 역할 분리**: 픽셀 폰트(`--font-pixel`, Orbitron)는 숫자·브랜드 로고 전용(한글 미지원),
   페이지 타이틀은 포스터 디스플레이체(`--font-serif`, Black Han Sans), 본문은 Pretendard.
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

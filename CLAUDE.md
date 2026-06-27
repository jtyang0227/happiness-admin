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

이 프로젝트의 UI는 두 앱에서 영감을 받은 **Cosmos × Pinterest 퓨전 디자인**을 사용한다.

| Reference | DNA | Key Elements |
|---|---|---|
| **Pinterest** | Light mode base, warm neutrals, masonry layout | Pin Red (#E60023), cream bg (#FAFAF8), column-count masonry, card hover overlay |
| **Cosmos** | Dark mode DNA, minimal black, collage hero | Pure black (#000000), tracked title, italic pill search, 2px-gap collage, underline tabs |

### CSS Variable System

모든 색상은 CSS 변수 단일 인터페이스를 통해 light/dark 자동 전환된다.

```css
/* Light mode (Pinterest base) */
:root {
  --color-bg:       #FAFAF8;
  --color-surface:  #FFFFFF;
  --color-surface-2: #F5F5F3;
  --color-text:     #1A1A1A;
  --color-text-2:   #767676;
  --color-border:   #E5E5E5;
  --color-brand:    #E60023;   /* Pin Red */
  --color-brand-2:  #AD081B;
}

/* Dark mode (Cosmos DNA) */
[data-theme="dark"], @media (prefers-color-scheme: dark) {
  --color-bg:       #000000;
  --color-surface:  #111111;
  --color-surface-2: #1A1A1A;
  --color-text:     #F5F5F5;
  --color-text-2:   #A0A0A0;
  --color-border:   #2A2A2A;
  --color-brand:    #FF4455;
  --color-brand-2:  #E60023;
}
```

### Key Component Patterns

| Component | Pattern | Notes |
|---|---|---|
| **Masonry grid** | `column-count` CSS (no JS) | `break-inside: avoid` on cards |
| **SlideOver** | Right panel, ESC to close, body scroll lock | Spring animation: `transform: translateX` |
| **Category tabs** | Sliding underline indicator | JS measures `offsetLeft + offsetWidth` of active tab |
| **Collage hero** | 3–5 images, 2px gap CSS grid | Named areas: `"a b" "a c"` |
| **Image blur reveal** | `filter: blur(4px) → blur(0)` on `onLoad` | `transition: filter 0.4s ease` |
| **Scroll entrance** | `IntersectionObserver` + `.visible` class | `opacity 0→1, translateY 16px→0` |
| **Pin card** | `position: relative`, hover shows overlay | `border-radius: 16px`, `overflow: hidden` |
| **Board card** | 3-split cover (CSS grid named areas) | Portfolio 대표 이미지 3장 |

### Font

```css
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable.css');
font-family: 'Pretendard Variable', -apple-system, sans-serif;
```

### Design Files

- `docs/design/PINTEREST_DESIGN_SPEC.md` — Pinterest 컨셉 전체 디자인 명세 (색상, 컴포넌트, 레이아웃)
- `docs/design/COSMOS_DESIGN_SPEC.md` — Cosmos × Pinterest 퓨전 명세 (다크모드, 고급 컴포넌트)
- `docs/design/CLAUDE_DESIGN_PROMPTS.md` — Claude에게 UI 구현 요청 시 사용할 재사용 가능한 프롬프트 라이브러리 (13개 컴포넌트)
- `docs/planning/APP_TO_ADMIN_SPEC.md` — happiness-app에서 admin으로 이식할 기능 명세

### Design Rules

1. **CSS 변수만 사용**: 하드코딩된 색상값 금지. 반드시 `var(--color-*)` 사용.
2. **다크모드 기본 지원**: 새 컴포넌트는 CSS 변수 시스템에 따라 자동으로 양쪽 테마를 지원해야 한다.
3. **이미지 blur reveal**: 모든 이미지는 `onLoad`에서 blur → clear 전환 적용.
4. **column-count 마소니**: JS 기반 마소니 라이브러리(Masonry.js, react-masonry-css) 사용 금지. 순수 CSS `column-count` 방식 사용.
5. **IntersectionObserver 입장 애니메이션**: 카드 리스트 페이지에서 스크롤 진입 시 fade+slide up 적용.
6. **Pretendard Variable 폰트**: 모든 페이지에 CDN 로드 필수.
7. **새 UI 구현 시**: `CLAUDE_DESIGN_PROMPTS.md`의 해당 프롬프트 섹션을 참조하여 일관성 유지.

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

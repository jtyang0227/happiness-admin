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

- **`controller/`** — REST endpoints. Auth: `AuthController` (`/api/auth/login` → JWT 발급). Admin: `AdminStatsController`, `AdminMemberController`, `AdminPhotoController`, `AdminInquiryController`, `AdminSeriesController`, `AdminSystemController` (모두 `/api/admin/**`).
- **`service/`** — `AuthService` (JWT 로그인), `MemberService`, `AdminStatsService`, `AdminMemberService`, `AdminPhotoService`, `AdminInquiryService`, `AdminSeriesService`.
- **`repository/`** — Spring Data JPA: `MemberRepository`, `PhotoRepository`, `InquiryRepository`, `SeriesRepository`, `SeriesPhotoRepository`.
- **`entity/`** — `Member`, `Photo`, `Inquiry`, `Series`, `SeriesPhoto`, `Authority` (WM/SA/US), `MemberStatus`.
- **`security/`** — `JwtTokenProvider`, `JwtAuthenticationFilter` (Bearer 토큰 검증).
- **`dto/`** — `LoginResponse`, `PageResponse<T>`, `AdminMemberDto`, `AdminPhotoDto`, `AdminInquiryDto`, `AdminSeriesDto`, `StatsSummaryDto`, `DailyStatDto`, `TopPhotoDto`, `DistItemDto`, `SystemStatusDto`, `RoleUpdateRequest`.
- **`DataInitializer`** — `@Profile("!prod")`: 서버 기동 시 H2에 테스트 데이터 자동 삽입 (관리자 2명, 회원 10명, 사진 30장, 문의 15건, 시리즈 8개). **개발 계정: `admin@happiness.dev` / `Admin123!`**

Key settings (`application.properties`):
- Server: `localhost:8081`
- H2 console: `localhost:8081/h2-console` (JDBC URL: `jdbc:h2:mem:happinessadmindb`)
- DDL: `create-drop` (schema recreated on every restart)
- JWT: `jwt.secret`, `jwt.expiration` (env 또는 dev 기본값 사용)
- 모든 `/api/admin/**` 엔드포인트는 `ROLE_WM` 또는 `ROLE_SA` JWT 필요

### Frontend (`frontend/src/`)

React SPA using React Router v6 + Recharts:

- **`context/AuthContext.jsx`** — JWT 저장/조회/삭제, `useAuth()` 훅 제공
- **`pages/`** — `LoginPage`, `DashboardPage` (요약카드+바차트), `MemberListPage`, `PhotoListPage`, `InquiryListPage`, `SeriesListPage`, `StatsPage` (꺾은선/파이/바 차트), `SystemPage`
- **`components/layout/`** — `Sidebar` (네비게이션), `AdminLayout` (사이드바+콘텐츠 래퍼)
- **`components/common/`** — `Pagination`
- **`utils/api.js`** — `getApi`, `postApi`, `patchApi`, `deleteApi` (localStorage JWT 자동 첨부, 401 시 `/login` 리다이렉트)
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

- `PINTEREST_DESIGN_SPEC.md` — Pinterest 컨셉 전체 디자인 명세 (색상, 컴포넌트, 레이아웃)
- `COSMOS_DESIGN_SPEC.md` — Cosmos × Pinterest 퓨전 명세 (다크모드, 고급 컴포넌트)
- `CLAUDE_DESIGN_PROMPTS.md` — Claude에게 UI 구현 요청 시 사용할 재사용 가능한 프롬프트 라이브러리 (13개 컴포넌트)
- `APP_TO_ADMIN_SPEC.md` — happiness-app에서 admin으로 이식할 기능 명세

### Design Rules

1. **CSS 변수만 사용**: 하드코딩된 색상값 금지. 반드시 `var(--color-*)` 사용.
2. **다크모드 기본 지원**: 새 컴포넌트는 CSS 변수 시스템에 따라 자동으로 양쪽 테마를 지원해야 한다.
3. **이미지 blur reveal**: 모든 이미지는 `onLoad`에서 blur → clear 전환 적용.
4. **column-count 마소니**: JS 기반 마소니 라이브러리(Masonry.js, react-masonry-css) 사용 금지. 순수 CSS `column-count` 방식 사용.
5. **IntersectionObserver 입장 애니메이션**: 카드 리스트 페이지에서 스크롤 진입 시 fade+slide up 적용.
6. **Pretendard Variable 폰트**: 모든 페이지에 CDN 로드 필수.
7. **새 UI 구현 시**: `CLAUDE_DESIGN_PROMPTS.md`의 해당 프롬프트 섹션을 참조하여 일관성 유지.

## Working Rules

1. **항상 기능 검증**: 코드 작성 후 반드시 백엔드는 `./gradlew build` + 서버 기동 후 API curl 테스트, 프론트엔드는 `npm run build` 로 빌드 성공을 확인한다.
2. **검증 완료 후 커밋·푸시**: 기능 검증이 통과된 경우에만 `git add → git commit → git push` 를 수행한다. 검증 실패 시 먼저 수정 후 재검증한다.

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

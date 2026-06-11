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

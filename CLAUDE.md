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

- **`controller/`** — REST endpoints. CORS is open (`@CrossOrigin(origins = "*")`). `AdminHelloController` and `AuthController` are the current controllers.
- **`service/`** — Business logic. `MemberService` handles user management.
- **`repository/`** — Spring Data JPA repositories for `Member`, `Board`, `Content`.
- **`entity/`** — JPA entities: `Member`, `Board`, `Content`, `Authority`, `MemberStatus`.
- **`dto/`** — Request/response objects: `LoginRequest`, `SignUpRequest`, `MemberResponse`.
- **`config/`** — Spring Security configuration.

Key settings (`application.properties`):
- Server: `localhost:8081`
- H2 console: `localhost:8081/h2-console` (JDBC URL: `jdbc:h2:mem:happinessadmindb`)
- DDL: `create-drop` (schema recreated on every restart)
- SQL logging is enabled

### Frontend (`frontend/src/`)

React SPA using React Router v6:

- **`pages/`** — Page-level components (`HomePage`, `NotFoundPage`)
- **`components/`** — Reusable UI components under `common/` and `layout/`
- **`hooks/`** — Custom React hooks
- **`utils/`** — Utility functions
- **`styles/`** — Global styles
- **`App.jsx`** — Router setup; `index.jsx` is the entry point

There is also a static `login.html` in `frontend/` served separately from the React app.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend runtime | Java 25, Spring Boot 3.5 |
| Build tool | Gradle 8.12 |
| ORM | Spring Data JPA + Hibernate |
| Database (dev) | H2 in-memory |
| Security | Spring Security 6 |
| Testing | JUnit 5, MockMvc, Spring Security Test |
| Code gen | Lombok |
| Frontend | React 18, React Router DOM 6 |
| Frontend tooling | Create React App (react-scripts 5) |
| Linting | ESLint 8 (`react-app` config) |

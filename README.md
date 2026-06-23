# Happiness Admin

React + Spring Boot 풀스택 어드민 대시보드.  
happiness-app에서 발생하는 회원·사진·문의·시리즈·포트폴리오 데이터를 관리자가 한눈에 보고 제어한다.

---

## 프로젝트 구조

```
happiness-admin/
├── frontend/   React 18 SPA — 포트 3001
└── backend/    Spring Boot 3.5 API — 포트 8081
```

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React 18, React Router v6, Recharts 3, lucide-react |
| Backend | Java 25, Spring Boot 3.5, Gradle 8.14 |
| ORM | Spring Data JPA + Hibernate |
| Database (dev) | H2 in-memory |
| Database (prod) | PostgreSQL (happiness-app과 동일 인스턴스) |
| 보안 | Spring Security 6, JWT |
| 테스트 | JUnit 5, MockMvc |

## 설치 및 실행

### 백엔드

```bash
cd backend

# 빌드 (테스트 제외)
./gradlew clean build -x test

# 개발 서버 실행
./gradlew bootRun
```

**개발 계정:** `admin@happiness.dev` / `Admin123!`  
**H2 콘솔:** `http://localhost:8081/h2-console` (JDBC URL: `jdbc:h2:mem:happinessadmindb`)

### 프론트엔드

```bash
cd frontend
npm install
npm start   # http://localhost:3001
```

## 구현된 페이지

| 경로 | 페이지 | 주요 기능 |
|------|--------|-----------|
| `/` | 대시보드 | 요약 카드 4개, 인기 사진 TOP 10, 최근 문의 |
| `/members` | 회원 관리 | 목록·검색, 역할 변경(WM/SA/US), 삭제 |
| `/photos` | 사진 관리 | 마소니 그리드, 키워드 검색, 5단계 카테고리 필터, 삭제 |
| `/portfolios` | 포트폴리오 | 승인/거절/숨기기/삭제, 상태별 필터 |
| `/series` | 시리즈 관리 | 목록·검색, 삭제 |
| `/inquiries` | 문의 관리 | 목록, 읽음 처리, 전체 읽음, 삭제 |
| `/stats` | 통계 | 업로드 추이, 신규 가입, 무드 분포, 촬영종류 분포, CSV 내보내기 |
| `/system` | 시스템 설정 | 서버 상태, 메일·Rate Limit 확인 |

## 핵심 API 엔드포인트

모든 `/api/admin/**` 엔드포인트는 `ROLE_WM` 또는 `ROLE_SA` JWT 필요.

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/auth/login` | 로그인 → JWT 발급 |
| GET | `/api/admin/stats/summary` | 요약 통계 |
| GET | `/api/admin/stats/daily` | 기간별 일별 추이 |
| GET | `/api/admin/stats/top-photos` | 인기 사진 TOP 10 |
| GET | `/api/admin/stats/mood-dist` | 색채무드 분포 |
| GET | `/api/admin/stats/shoot-type-dist` | 촬영종류 분포 |
| GET | `/api/admin/members` | 회원 목록 (검색·페이지네이션) |
| PATCH | `/api/admin/members/{id}/role` | 역할 변경 |
| DELETE | `/api/admin/members/{id}` | 회원 삭제 |
| GET | `/api/admin/photos` | 사진 목록 (검색·카테고리·정렬·페이지네이션) |
| PATCH | `/api/admin/photos/{id}/category-code` | 카테고리 코드 변경 |
| DELETE | `/api/admin/photos/{id}` | 사진 삭제 |
| GET | `/api/admin/portfolios` | 포트폴리오 목록 |
| PATCH | `/api/admin/portfolios/{id}/approve` | 포트폴리오 승인 |
| PATCH | `/api/admin/portfolios/{id}/reject` | 포트폴리오 반려 |
| PATCH | `/api/admin/portfolios/{id}/hide` | 포트폴리오 숨기기 |
| GET | `/api/admin/inquiries` | 문의 목록 (필터·페이지네이션) |
| PATCH | `/api/admin/inquiries/{id}/read` | 읽음 처리 |
| PATCH | `/api/admin/inquiries/read-all` | 전체 읽음 처리 |
| GET | `/api/admin/series` | 시리즈 목록 (검색·페이지네이션) |
| GET | `/api/admin/system/status` | 시스템 상태 |

## 디자인 시스템

**Cosmos × Pinterest 퓨전 디자인** — CSS 변수 단일 인터페이스로 라이트/다크 자동 전환.

- 라이트: Pin Red (#E60023), 크림 배경 (#FAFAF8), column-count 마소니
- 다크: Pure Black (#000000), Cosmos DNA, 슬라이딩 언더라인 탭
- 폰트: Pretendard Variable (CDN)

자세한 내용: `COSMOS_DESIGN_SPEC.md`, `PINTEREST_DESIGN_SPEC.md`, `CLAUDE_DESIGN_PROMPTS.md`

## 기획 문서 목록

| 파일 | 내용 |
|------|------|
| `ADMIN_PLAN.md` | 초기 7개 페이지 구현 기획 (v1.0, 완료) |
| `PRODUCT_SPEC.md` | 서비스 전체 기획 (앱↔Admin 역할 정의) |
| `APP_ADMIN_SPEC.md` | 앱 연동 통합 기획 + P0-P3 로드맵 |
| `APP_TO_ADMIN_SPEC.md` | happiness-app 기능 이식 상세 기획 |
| `DESIGN_ROADMAP.md` | UI 리팩토링 Phase 0-10 로드맵 |
| `DESIGN_SPEC.md` | UI/UX 디자인 시스템 명세 |
| `PINTEREST_DESIGN_SPEC.md` | Pinterest 컨셉 디자인 명세 |
| `COSMOS_DESIGN_SPEC.md` | Cosmos × Pinterest 퓨전 명세 |
| `CLAUDE_DESIGN_PROMPTS.md` | Claude Code UI 요청 프롬프트 라이브러리 |
| `PHOTO_SEARCH_SPEC.md` | 사진 5단계 카테고리 & 검색 기획 |
| `PORTFOLIO_DESIGN_SPEC.md` | 포트폴리오 디자인 명세 |
| `CLAUDE_HARNESS_GUIDE.md` | Claude Code 활용 가이드 |

---

생성일: 2026-04-18 | 최종 업데이트: 2026-06-23

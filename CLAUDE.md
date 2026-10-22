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

- **`controller/`** — REST endpoints. Auth: `AuthController` — **`POST /api/auth/login`만** 공개(회원가입·이메일 확인·회원 조회·OAuth·`/api/auth/admin/login`은 삭제됨 — 과거 비로그인 `GET /api/auth/member/{id}`가 회원 이메일·전화번호를 반환하던 치명 결함, `docs/planning/PRIVACY_PROTECTION_PLAN.md` F1). 로그인 실패 메시지는 단일화, 같은 이메일 5회 실패 시 15분 잠금(429). Admin (모두 `/api/admin/**`, `ROLE_WM`/`ROLE_SA` 필요):
  - `AdminStatsController` — 대시보드 통계
  - `AdminMemberController` — 회원 목록/상세/역할 변경/상태 변경(정지·해제·탈퇴 처리·복구), `/summary`, `POST /export`, `/{id}/history`, `/{id}/notes`. 영구 삭제(`DELETE`)는 **WM 전용 + 이미 `DELETED`인 회원만**, 연관 데이터(예약·포트폴리오·인증·피처드·댓글·프로필 콘텐츠 등)를 FK 순서대로 정리. 본인 계정 조치 금지, 관리자 계정 정지·탈퇴는 WM만
  - `AdminPhotoController` — 사진 목록/삭제/카테고리코드 수정
  - `AdminInquiryController` — 문의 목록(receiverId·senderId 필터)/읽음 처리/삭제
  - `AdminSeriesController` — 시리즈 목록/삭제, 작업 큐레이션(`GET /series/curation`, `PUT /series/{id}/featured` — App 탐색 "에디터 추천")
  - `AdminCommentController` — App 사진 댓글 목록/검색/삭제(최상위 삭제 시 답글 포함)
  - `AdminGatheringController` — App 모임 목록·상태별 집계/모임 피드 게시글 조회·삭제
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
  - `AdminSecurityAuditController` — App 보안 감사 로그 조회(`/security-audit`, `/summary` — 24h 로그인 실패·실패 상위 IP), 읽기 전용
  - `AdminProfileContentController` — 작가 프로필 콘텐츠 5종(`type=testimonials|pricing|press|achievements|brands`) 목록/삭제
  - `AdminNewsletterController` — 뉴스레터 구독자 목록·집계, `POST /export`(활성 구독자, 활동 로그 기록)
  - `AdminTransactionController` — 미팅·납품 메타데이터 집계/정체 건/목록, 읽기 전용
  - `AdminPrivacyLogController` — 개인정보 접속기록 조회·`/summary`·`/verify`(해시 체인 무결성)·`POST /inspections`(점검 기록). **WM 전용**, 수정·삭제 API 없음
  - `AdminHelloController` — 헬스체크용 샘플 엔드포인트
- **`service/`** — `AuthService`, `MemberService`, `AdminStatsService`, `AdminMemberService`, `AdminPhotoService`, `AdminInquiryService`, `AdminSeriesService`, `AdminPortfolioService`, `AdminCategoryService`, `AdminSortService`, `AdminReportService`, `AdminReportAiTriageService`+`ReportAiTriageWriter`(§AI 연동), `AdminNoticeService`, `AdminBannerService`, `AdminPopupService`, `AdminFeaturedService`, `AdminVerificationService`, `AdminBookingService`, `AdminContentPolicyService`, `AdminCommentService`, `AdminGatheringService`, `AdminSecurityAuditService`, `AdminProfileContentService`, `AdminNewsletterService`, `AdminTransactionService`, `AdminActivityRecorder`(현재 관리자로 `admin_activity_logs` 기록, 스케줄러용 `recordSystem` — 회원 조치·큐레이션·댓글/게시글 삭제·내보내기가 사용), `MemberSuspensionScheduler`(10분마다 기간 만료 정지 자동 해제 — App은 `SUSPENDED`면 로그인을 막으므로 해제하지 않으면 영구 정지가 됨, `admin.member.suspension-check-ms`로 주기 조정), `AdminPrivacyLogService`, `GeminiClientService`(§AI 연동).
- **`privacy/`** — `FieldEncryptor`(AES-256-GCM, `enc:v1:` 접두어, 접두어 없는 기존 평문은 그대로 읽음, 키 `PRIVACY_ENCRYPTION_KEY` — prod에서 없으면 기동 실패), `EncryptedStringConverter`(JPA 투명 암호화 — `admin_member_notes.content`, `members.suspend_reason`에 적용, 정지 사유는 암호문이 varchar(500)에 들어가도록 평문 100자 상한), `PrivacyMasker`(이메일·전화 마스킹 — 회원·문의·신고·인증·뉴스레터 DTO가 항상 마스킹해 응답), `PrivacyAccessRecorder`(개인정보 접속기록 LIST/VIEW/REVEAL/EXPORT/INSPECTION, SHA-256 해시 체인, 열람·다운로드는 사유 5자 이상 필수).
- **`repository/`** — Spring Data JPA: `MemberRepository`, `PhotoRepository`, `InquiryRepository`, `SeriesRepository`, `SeriesPhotoRepository`, `PortfolioRepository`, `PortfolioItemRepository`, `PhotoCategoryRepository`, `ReportRepository`, `NoticeRepository`, `BannerRepository`, `PopupRepository`, `FeaturedItemRepository`, `VerificationRequestRepository`, `BookingRepository`, `SystemConfigRepository`, `AdminActivityLogRepository`, `CommentRepository`, `Gathering*Repository`(모임·참여자·게시글·사진·좋아요·댓글), `SecurityAuditLogRepository`, `TestimonialRepository`·`PricingPackageRepository`·`PressFeatureRepository`·`AchievementRepository`·`ClientBrandRepository`, `NewsletterSubscriberRepository`, `MeetRepository`, `DeliverySetRepository`, `AdminMemberNoteRepository`, `PrivacyAccessLogRepository`.
  **주의**: `BoardRepository`/`ContentRepository`(및 `Board`/`Content` 엔티티)는 어떤 컨트롤러·서비스에서도 참조되지 않는 죽은 코드다 — 실제 게시판 기능은 없다(확인 필요 시 grep으로 재검증할 것, 새 기능을 여기 얹지 말 것).
- **`entity/`** — `Member` (suspendReason·suspendUntil·isVerified 포함), `Photo` (displayOrder), `Inquiry`(+`InquiryProcessStatus`), `Series` (displayOrder), `SeriesPhoto` (displayOrder), `Portfolio`, `PortfolioItem` (displayOrder), `PhotoCategory`, `Report`(aiSummary·aiSeverity·aiSuggestedAction·aiAnalyzedAt 포함, §AI 연동), `Notice`, `Banner`, `Popup`, `FeaturedItem`, `VerificationRequest`, `Booking`(+`BookingStatus`), `SystemConfig`, `AdminActivityLog`, `Authority` (WM/SA/US), `MemberStatus`, `PortfolioStatus`, `PortfolioVisibility`, `Comment`, `Gathering`/`GatheringParticipant`/`GatheringPost`/`GatheringPhoto`/`GatheringPostLike`/`GatheringPostComment`, `SecurityAuditLog`, `Testimonial`/`PricingPackage`/`PressFeature`/`Achievement`/`ClientBrand`, `NewsletterSubscriber`(token은 응답 제외), `Meet`/`DeliverySet`(메타데이터만 — 메시지·주소·토큰·비밀번호·피드백은 의도적으로 미매핑), `AdminMemberNote`(Admin 전용 신규 테이블 `admin_member_notes` — 운영자 내부 메모, 내용 암호화 저장), `PrivacyAccessLog`(Admin 전용 `admin_privacy_access_logs` — 개인정보 접속기록, 해시 체인).
  **개인정보 규칙**: 회원 이메일·전화를 응답에 원문으로 넣지 말 것(항상 `PrivacyMasker`). 원문이 꼭 필요하면 사유를 받고 `PrivacyAccessRecorder.record("REVEAL"…)`. 새 CSV/다운로드는 사유 필수 + `EXPORT` 기록. 주민번호·카드·계좌 등 고시 제7조 암호화 대상을 저장하게 되면 반드시 `EncryptedStringConverter`. App 공유 컬럼(email/tel/name)은 App이 평문으로 읽으므로 Admin 단독으로 암호화하지 말 것.
  **App 테이블 미러링 규칙**: prod에서 Admin은 App과 같은 Postgres(`ddl-auto=update`)를 쓴다 — `Comment`·`Gathering*`·`SecurityAuditLog`·프로필 콘텐츠 5종·`NewsletterSubscriber`·`Meet`·`DeliverySet`·`Series.draft/featuredAt/shootType`은 App 엔티티의 테이블·컬럼명을 그대로 부분 매핑한 것이다. 새로 매핑하는 컬럼은 App과 이름을 맞추고, App에 없는 NOT NULL 컬럼을 추가하지 말 것(배경: `docs/planning/APP_FEATURE_SYNC_PLAN.md` §6).
- **`security/`** — `JwtTokenProvider`, `JwtAuthenticationFilter` (Bearer 토큰 검증, principal = 이메일 — **매 요청 DB에서 회원을 다시 읽어 `ACTIVE`+WM/SA일 때만 인증하고 권한도 DB 값 사용**: 강등·정지 즉시 차단, 토큰 클레임으로 권한 상승 불가), `CurrentAdminProvider`(요청 중인 관리자 `Member` 조회 — 권한 가드·이력 기록용), `LoginAttemptLimiter`(인메모리 로그인 잠금 — 다중 인스턴스 시 공유 저장소 필요). 공개 경로는 `POST /api/auth/login`, `GET /api/popups/active`, `GET /actuator/health`뿐(H2 콘솔은 `spring.h2.console.enabled`일 때만). JWT 기본 만료 8시간. CORS는 `cors.allowed-origins`(운영 `CORS_ALLOWED_ORIGINS`) 목록만, 자격증명(쿠키) 비허용. 엔티티를 `@RequestBody`로 직접 받지 말 것(과거 활동 로그 덮어쓰기 취약점 — 요청 DTO 사용). 관리자가 입력해 App에 노출되는 URL은 `util/UrlSafety`로 검증. 점검 기록: `docs/security/SECURITY_AUDIT_2026-10.md`. `@PreAuthorize` 거부는 `GlobalExceptionHandler`에서 403으로 변환. 모든 `/api/admin/**`는 `ROLE_WM` 또는 `ROLE_SA` 필요.
- **`dto/`** — `LoginResponse`, `PageResponse<T>`, `AdminMemberDto` (portfolioCount 포함), `AdminPhotoDto`, `AdminInquiryDto`, `AdminSeriesDto`, `AdminPortfolioDto`, `StatsSummaryDto`, `DailyStatDto`, `TopPhotoDto`, `DistItemDto`, `SystemStatusDto`, `RoleUpdateRequest`, `StatusUpdateRequest`, `CategoryDto`, `ReorderItem`, `SortPhotoDto`, `SortSeriesDto`, `SortSeriesPhotoDto`, `SortPortfolioItemDto`.
- **`DataInitializer`** — `@Profile("!prod")`: 서버 기동 시 H2에 테스트 데이터 자동 삽입 (관리자 2명, 회원 10명, 사진 30장·displayOrder 1–30, 문의 15건, 시리즈 8개·displayOrder 1–8, 포트폴리오 6개). **개발 계정: `admin@happiness.dev` / `Admin123!`**

Key settings (`application.properties`):
- Server: `localhost:8081`
- H2 console: `localhost:8081/h2-console` (JDBC URL: `jdbc:h2:mem:happinessadmindb`)
- DDL: `create-drop` (schema recreated on every restart)
- JWT: `jwt.secret`, `jwt.expiration` (env 또는 dev 기본값 사용)

### Frontend (`frontend/src/`)

React SPA using React Router v7 (라이브러리 모드, v6와 같은 `BrowserRouter`/`Routes` API) + Recharts. 운영 빌드는 `.env.production`(`INLINE_RUNTIME_CHUNK=false` — `vercel.json` CSP `script-src 'self'` 유지용, 소스맵 비공개), 보안 헤더는 `vercel.json`:

- **`context/AuthContext.jsx`** — JWT 저장/조회/삭제, `useAuth()` 훅 제공. **30분 무조작 시 자동 로그아웃**(`/login?reason=idle`, 탭 간 공유되는 `admin_last_activity` 기준 — 고시 제6조 자동 접속차단)
- **`context/ConfirmContext.jsx`** — 전역 확인 다이얼로그, `useConfirm()` 훅 제공
- **`pages/`** —
  - `LoginPage` — JWT 로그인 (앱 전체 다크모드와 무관하게 항상 라이트 고정). `admin_user`에 `memberId`도 저장(본인 판별용)
  - `DashboardPage` — "처리 대기" 그라디언트 히어로(심사·신고·인증·미읽음 문의 합계) + 처리 큐 카드 3종(최다 건 오렌지 보더) + KPI 스트립(lucide 아이콘) + 심사 대기 포트폴리오 + 활동 피드 + 예약 캘린더
  - `MemberListPage` — 현황 카드(클릭=상태 필터, 3일 내 자동 해제 수), 상태 `SegmentedControl`, 검색·역할 필터, CSV 내보내기, 행 조치(정지·해제·탈퇴·복구·WM 영구 삭제, 본인 행은 "나" 표시·조치 없음)
  - `MemberDetailPage` — 회원 상세·KPI·탭 8개(요약·사진·시리즈·포트폴리오·문의·댓글·보안 기록·관리 이력·메모), 정지 모달·탈퇴/복구/영구 삭제, 자동 해제 D-day 표시
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
  - `CurationPage` (`/curation`) — 작업 "에디터 추천" 올리기/내리기(추천 중·후보 세그먼트)
  - `CommentListPage` (`/comments`) — App 사진 댓글 검색·삭제
  - `GatheringListPage` (`/gatherings`) — App 모임 목록·상태 필터, SlideOver에서 모임 피드 게시글 삭제
  - `SecurityAuditPage` (`/security-audit`, 설정) — 보안 감사 로그 유형·기간·IP 필터, 실패 상위 IP 드릴다운
  - `ProfileContentPage` (`/profile-content`, 회원) — 작가 후기·가격·언론·수상·브랜드 점검/삭제(`?memberId=` 필터)
  - `NewsletterPage` (`/newsletter`, 운영·마케팅) — 구독자 목록·KPI·CSV 내보내기(클라이언트에서 BOM 포함 CSV 생성)
  - `TransactionsPage` (`/transactions`, 운영·마케팅) — 미팅·납품 상태 집계와 정체/만료 알림, 읽기 전용
  - `PrivacyLogPage` (`/privacy-logs`, 설정, WM 전용) — 개인정보 접속기록 필터·무결성 검증·점검 완료 기록
- **`components/layout/`** — `navConfig.js`(그룹↔라우트 단일 소스, `findActiveGroup`), `AdminTopbar`(상단 pill 탭 5그룹·검색·상태·다크모드 토글·프로필), `IconRail`(활성 그룹 페이지용 플로팅 아이콘 레일, 모바일 ≤767px에서는 하단 바, 정렬 관리는 팝오버), `AdminLayout`. `Sidebar`는 V14에서 삭제됨
- **`components/common/`** — `Pagination`, `ConfirmDialog`, `SlideOver`, `ImgWithFallback`, `SegmentedControl`(pill 세그먼트 필터, 카운트 배지), `ReasonDialog`(개인정보 열람·다운로드 사유 입력 — 회원 상세 "개인정보 보기", 회원·뉴스레터 CSV)
- **`hooks/useDragSort.js`** — HTML5 DnD 기반 정렬 훅. `toReorderPayload()` 로 `[{id, displayOrder}]` 생성
- **`utils/safeUrl.js`** — `safeHref()`: 사용자 입력 URL을 링크로 쓸 때 반드시 통과(http(s)만, `javascript:` 차단). **`utils/csv.js`** — `csvCell()`: CSV 이스케이프 + 수식 주입 방지(모든 내보내기에 사용)
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

현재(7차) 디자인 컨셉은 **V14 Minimal Premium** — 라이트 캔버스(#F5F3F6) 위 오렌지(#EC572D) 하나, 블랙 pill CTA·탭, 테두리 없는 둥근 카드와 약한 섀도우로 만드는 미니멀 UI 문법이다. 6차 Toss(파랑)도 폐기되었다 — 구조(상단 pill 탭 + 플로팅 아이콘 레일)와 팔레트가 모두 바뀌었다. 1~5차(Cosmos × Pinterest → Railway DNA →
Pixel Arcade → 和ドット → AKIRA Neo-Tokyo)는 전부 폐기되었다 — 관련 기록 문서는 더 이상
리포지토리에 없다(과거 세대의 팔레트·컴포넌트 디테일이 필요하면 git 히스토리 참고). 5차
AKIRA의 각진 프레임·하드 오프셋 섀도우·네온 포인트·CRT 텍스처는 전부 폐기했다 — 6차는
톤 전환이 아니라 구조 자체의 전환이다.

| DNA | Key Elements |
|---|---|
| **둥근 카드** | 둥근 모서리(`--radius-sm` 8px ~ `--radius-2xl` 24px), 소프트 엘리베이션 섀도우(`--shadow-ring`), 하드 오프셋 없음 |
| **V14 팔레트** | 오렌지(#EC572D) 브랜드(강조·선택·히어로 그라디언트 전용), 잉크(#151316) pill CTA/활성 탭(`--color-ink`), sky 보조 액센트, 다크는 구조 동일·오렌지만 한 단계 밝게 |
| **인터랙션** | 클릭 시 `scale(0.97)` 스퀴시, hover 시 `filter: brightness(0.96)` 또는 소프트 리프트 — 하드 오프셋/픽셀 블링크 없음 |

### CSS Variable System

모든 색상은 CSS 변수 단일 인터페이스를 통해 light/dark 자동 전환된다. **실제 존재하는
토큰만 사용할 것** — `--color-text`, `--color-text-2` 같은 이름은 정의되어 있지 않다
(과거 이 문서에 잘못 기재되어 있었고, 상속으로 우연히 렌더링되던 잠재 버그의 원인이었다).

```css
/* frontend/src/styles/tokens.css 실제 정의 (발췌) */
:root {
  --color-bg:             #F5F3F6;  /* 옅은 라벤더 그레이 캔버스 (라이트) */
  --color-surface:        #FFFFFF;
  --color-surface-2:      #F8F6F9;
  --color-border:         #ECE9EE;  /* 카드는 기본적으로 보더 없이 섀도우만 — 보더는 테이블 행·입력창용 */
  --color-text-primary:   #151316;
  --color-text-secondary: #4E5968;
  --color-text-tertiary:  #8B95A1;
  --color-brand:          #EC572D;  /* V14 오렌지 — 강조·선택·진행 상태 전용 */
  --color-brand-light:    #FEF2F0;
  --color-ink:            #151316;  /* 블랙 pill CTA(.btn-primary)·활성 탭/레일 */
  --color-ink-text:       #FFFFFF;
  --gradient-hero:        linear-gradient(135deg, #F37851 0%, #DB481F 100%);
  --color-accent:         #0EA5E9;  /* sky, 보조 액센트 */
  --color-success/-warning/-danger/-info: ... /* 각각 -bg 페어 존재 */
  --shadow-ring: 0 1px 2px rgba(21,19,22,.03), 0 6px 18px rgba(21,19,22,.04); /* 약한 소프트 엘리베이션 */
  --topbar-height: 64px;  --rail-width: 56px;
  /* --color-sidebar-*, --sidebar-width-* 는 V14에서 삭제됨 */
}

/* 다크모드: 같은 구조를 어둡게 파생 — 잉크는 밝은 pill로 반전, 오렌지만 한 단계 밝게 */
[data-theme="dark"], @media (prefers-color-scheme: dark) {
  --color-bg:      #121113;
  --color-surface: #1C1A1E;
  --color-border:  #2E2B31;
  --color-text-primary: #F5F3F6;
  --color-ink:     #F5F3F6;  --color-ink-text: #151316;
  --color-brand:   #FF7347;
}
```

전체 설계 근거·토큰 표는 `docs/planning/V14_MINIMAL_DESIGN_PLAN.md`, 세대 계보는 `docs/design/TOSS_DESIGN_SPEC.md` 참고.

### Key Component Patterns

| Component | Pattern | Notes |
|---|---|---|
| **카드/테이블/모달** | 보더 없이 `box-shadow: var(--shadow-ring)` + `--radius-xl`(20px) | 강조 카드만 `2px solid var(--color-brand)` 보더(예: 대시보드 최다 큐, 추천 중 작업) |
| **SegmentedControl** | 흰 pill 트랙 + 활성 항목 `--color-ink` 채움, 카운트 배지(활성 시 오렌지) | 상태·기간 필터는 이 컴포넌트로 통일(탭 밑줄·사각 버튼 그룹 새로 만들지 말 것) |
| **StatusDot** | `border-radius: var(--radius-full)` 원형 | 다이아몬드/사각 아님 |
| **TopNav/IconRail active** | `--color-ink` 블랙 pill 배경 + `--color-ink-text` | 대시보드는 레일 없음, 아이콘에 `aria-label`+툴팁 |
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

- `docs/planning/V14_MINIMAL_DESIGN_PLAN.md` — **현재(7차) V14 디자인 기획·토큰·구조**
- `docs/design/TOSS_DESIGN_SPEC.md` — 디자인 세대 계보 + 6차 Toss 구현 기록(레거시 참고용)
- `docs/planning/APP_TO_ADMIN_SPEC.md` — happiness-app에서 admin으로 이식할 기능 명세. **주의: 이 문서(2026-06-23자)는 이미 낡았다** — "신고/제재 미구현(P2)"라고 적혀 있지만 실제로는 `AdminReportController`/`ReportListPage`가 완전히 구현돼 있고 AI 트리아지까지 붙어 있다(§AI 연동). 이 문서의 구현 여부 표시를 그대로 믿지 말고 코드로 재확인할 것.
- `docs/planning/PRIVACY_PROTECTION_PLAN.md` — 개인정보 보호 강화(법령 근거표, 결함 F1~F7, 암호화·마스킹·접속기록 설계, App 공유 컬럼 후속 과제)
- `docs/planning/MEMBER_MGMT_V2_PLAN.md` — 회원 관리 2차(운영 결함 D1~D6: 삭제 500·정지 미해제·본인 조치·이력 부재 등) 기획·구현 기록. 1차 `MEMBER_MGMT_SPEC.md`는 구현 현황 표가 낡음
- `docs/planning/APP_FEATURE_SYNC_PLAN.md` — App(2026-10-20) 기능 분석 → Admin 반영 2차 기획(큐레이션·댓글·모임 구현, 태그·미팅·납품은 보류 사유 포함)
- `docs/planning/AX_REPORT_TRIAGE_PLAN.md` — 신고 트리아지 AI 어시스트 기획(위 AI 연동 섹션의 설계 근거)
- 그 외 `docs/planning/*.md` — 기능별 기획서 다수(배치 로직, 대시보드/통계 역할 재정의 등). 새 기획 작업 전에 관련 파일이 이미 있는지 먼저 확인할 것.

### Design Rules

1. **CSS 변수만 사용**: 하드코딩된 색상값 금지. 반드시 실제 존재하는 `var(--color-*)` 사용 —
   작업 전 `frontend/src/styles/tokens.css`에서 토큰명을 확인할 것(이 문서의 표기만 믿지 말 것).
2. **다크모드 기본 지원**: 새 컴포넌트는 CSS 변수 시스템에 따라 자동으로 양쪽 테마를 지원해야 한다.
   다크는 라이트와 같은 구조를 어둡게 파생한다(잉크 pill만 밝게 반전, 오렌지는 한 단계 밝게) —
   하드코딩된 보더/배경 조합을 피하고 `--color-ink`/`--color-ink-text` 쌍으로 대비를 맞출 것.
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
| `CORS_ALLOWED_ORIGINS` | 콤마 구분 프론트 도메인 (예: `https://admin.example.com`) | 운영 권장 — 미설정 시 `*`(자격증명 없음) + 경고 로그 |
| `PRIVACY_ENCRYPTION_KEY` | Base64 32바이트 (`openssl rand -base64 32`) | **운영(Railway) 필수** — 없으면 prod 프로필 기동 실패. 개인정보 필드 암호화 키, 분실 시 암호화된 메모·정지 사유 복호화 불가 |

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
| Backend runtime | Java 25, Spring Boot 3.5.16 |
| Build tool | Gradle 8.14.4 |
| ORM | Spring Data JPA + Hibernate |
| Database (dev) | H2 in-memory |
| Security | Spring Security 6 |
| Testing | JUnit 5, MockMvc, Spring Security Test |
| Code gen | Lombok |
| Frontend | React 18, React Router DOM 7, Recharts 3 |
| Frontend tooling | Create React App (react-scripts 5) |
| Linting | ESLint 8 (`react-app` config) |

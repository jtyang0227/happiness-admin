# Happiness Admin — 대시보드 구현 기획서

> 작성일: 2026-06-11  
> **구현 완료: 2026-06-11** ✅  
> 연동 앱: [happiness-app](https://github.com/jtyang0227/happiness-app)  
> 목적: happiness-app에서 쌓인 데이터를 관리자가 한눈에 보고 제어할 수 있는 어드민 대시보드

---

## 📋 구현 범위 요약

| 페이지 | 우선순위 | 핵심 기능 |
|--------|----------|-----------|
| 페이지 | 우선순위 | 핵심 기능 | 상태 |
|--------|----------|-----------|------|
| **대시보드 홈** | 🔴 1순위 | 요약 카드, 최근 문의, 인기 사진 | ✅ 완료 |
| **회원 관리** | 🔴 1순위 | 목록/검색, 역할 변경, 삭제 | ✅ 완료 |
| **사진 관리** | 🔴 1순위 | 전체 사진 그리드, 삭제 | ✅ 완료 |
| **문의 관리** | 🔴 1순위 | 전체 문의 목록, 읽음/삭제 | ✅ 완료 |
| **통계** | 🟡 2순위 | 업로드 추이, 인기 사진 TOP 10, 무드 분포 | ✅ 완료 |
| **시리즈 관리** | 🟢 3순위 | 전체 시리즈 목록, 삭제 | ✅ 완료 |
| **시스템 설정** | 🟢 3순위 | 메일 설정 상태, Rate Limit 확인 | ✅ 완료 |

---

## 1. 기술 스택

### 현재 구성

| 영역 | 기술 |
|------|------|
| Frontend | React 18, React Router v6 (포트 3001) |
| Backend | Spring Boot 3.5, Java 25, Gradle 8.12 (포트 8081) |
| DB (dev) | H2 in-memory |
| DB (prod) | happiness-app과 **동일한 PostgreSQL** 연결 |
| 보안 | Spring Security 6 |

### 추가 필요

| 영역 | 추가 항목 | 이유 |
|------|-----------|------|
| Frontend | Chart.js 또는 Recharts | 통계 그래프 |
| Backend | happiness-app과 동일한 JPA 엔티티 | DB 직접 조회 |
| Backend | JWT 검증 필터 (Admin 전용) | 관리자 인증 |
| Backend | Spring Data JPA 집계 쿼리 | 통계 API |

---

## 2. 데이터 연동 전략

### 방식: 동일 PostgreSQL 직접 연결 (권장)

```
Admin Frontend (3001)
       │
Admin Backend (8081)
       │
   PostgreSQL  ←── happiness-app Backend (8080)도 동일 DB 사용
```

**이유:**
- happiness-app의 DB에 이미 회원/사진/문의/시리즈 데이터가 모두 있음
- Admin Backend에서 집계 쿼리(GROUP BY, COUNT, trend 등)를 직접 실행 가능
- happiness-app API를 통한 중계보다 성능이 좋고 관리가 단순함

**운영 환경변수 추가 필요 (Railway):**
```bash
DATABASE_URL=postgresql://user:pass@host:5432/db   # happiness-app과 동일값
JWT_SECRET=<happiness-app과 동일한 시크릿>
```

---

## 3. 구현 페이지 상세 기획

### 3-1. 대시보드 홈 (`/`)

**요약 카드 4개:**
| 카드 | 데이터 | 쿼리 |
|------|--------|------|
| 전체 회원 수 | members 테이블 COUNT | `SELECT COUNT(*) FROM members` |
| 전체 사진 수 | photos 테이블 COUNT | `SELECT COUNT(*) FROM photos` |
| 오늘 신규 문의 | inquiries.created_at = today | `WHERE DATE(created_at) = CURRENT_DATE` |
| 미읽음 문의 | inquiries.is_read = false | `WHERE is_read = false` |

**최근 7일 사진 업로드 추이 (Bar Chart):**
```sql
SELECT DATE(created_at) AS day, COUNT(*) AS count
FROM photos
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY day ORDER BY day
```

**최근 문의 5건:** 최신순, 보낸 사람 이름·이메일·촬영 종류·날짜 표시

**인기 사진 TOP 5:** `ORDER BY likes_count DESC LIMIT 5`

---

### 3-2. 회원 관리 (`/members`)

**목록 테이블 컬럼:**
- 이름, 이메일, 프로필명(@), 역할(WM/SA/일반), 사진수, 가입일

**기능:**
- 검색: 이름 · 이메일 키워드
- 필터: 역할별 (전체 / WM / SA)
- 역할 변경: 드롭다운 → PATCH 요청
- 삭제: 확인 다이얼로그 후 DELETE (cascade: 사진/시리즈/문의 포함)
- 페이지네이션: 20건씩

**회원 상세 모달:**
- 프로필 정보 + 사진 목록 미리보기 (최대 6개) + 시리즈 수 + 수신 문의 수

---

### 3-3. 사진 관리 (`/photos`)

**그리드 뷰 (3열):**
- 썸네일, 제목, 작가명, 무드 배지, 좋아요 수, 등록일

**기능:**
- 필터: 작가(memberId), 색채 무드(colorMood)
- 정렬: 최신순 / 좋아요 많은순 / 저장 많은순
- 삭제: 관리자 직접 삭제 (PhotoLike/PhotoSave/PhotoTag cascade)
- 페이지네이션: 24건씩

---

### 3-4. 문의 관리 (`/inquiries`)

**개인 수신함과의 차이:** 작가별 필터 없이 **전체 문의** 조회 가능

**목록 컬럼:**
- 보낸 사람, 받는 작가(@profileName), 촬영 종류, 희망 날짜, 예산, 접수일, 읽음 여부

**기능:**
- 필터: 작가별 / 읽음·안읽음 / 촬영 종류별
- 내용 확장: 클릭 시 메시지 전문 펼침
- 삭제
- 페이지네이션: 20건씩

---

### 3-5. 통계 (`/stats`) — Phase 2-4 핵심

**① 기간별 추이 (꺾은선 그래프)**
- X축: 날짜, Y축: 건수
- 선택: 사진 업로드 / 신규 가입 / 문의 접수
- 기간 선택: 최근 7일 / 30일 / 90일

```sql
-- 예: 최근 30일 사진 업로드 추이
SELECT DATE(created_at) AS day, COUNT(*) AS count
FROM photos
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY day ORDER BY day
```

**② 인기 사진 TOP 10 (테이블)**
- 컬럼: 순위, 썸네일, 제목, 작가, 좋아요, 저장, 공유
- 정렬 기준 선택: 좋아요 / 저장 / 공유

**③ 색채 무드 분포 (파이 차트)**
```sql
SELECT color_mood, COUNT(*) AS count
FROM photos
WHERE color_mood IS NOT NULL
GROUP BY color_mood
```

**④ 촬영 종류별 문의 분포 (가로 바 차트)**
```sql
SELECT shoot_type, COUNT(*) AS count
FROM inquiries
WHERE shoot_type IS NOT NULL
GROUP BY shoot_type ORDER BY count DESC
```

---

### 3-6. 시리즈 관리 (`/series`)

**목록 테이블:**
- 커버 이미지(썸네일), 제목, 작가명, 사진 수, 생성일

**기능:**
- 필터: 작가별
- 시리즈 삭제 (SeriesPhoto cascade)
- 페이지네이션: 20건씩

---

### 3-7. 시스템 설정 (`/system`)

**이메일 설정 상태 카드:**
- MAIL_HOST 설정 여부 (설정됨 ✅ / 미설정 ⚠️)
- 최근 이메일 발송 로그 (향후 구현)

**Rate Limit 정보:**
- 현재 설정값: capacity / refill-tokens / refill-seconds (application.yml 기반)

---

## 4. Backend API 설계 (`/api/admin/`)

### 인증
모든 `/api/admin/**` 엔드포인트는 **WM 또는 SA 역할** JWT 필요

```
GET  /api/admin/stats/summary          → 홈 요약 카드 4개
GET  /api/admin/stats/daily?days=7     → 일별 업로드/가입/문의 추이
GET  /api/admin/stats/top-photos       → 인기 사진 TOP 10
GET  /api/admin/stats/mood-dist        → 무드 분포
GET  /api/admin/stats/shoot-type-dist  → 촬영 종류 분포

GET    /api/admin/members              → 회원 목록 (page, size, search, role)
PATCH  /api/admin/members/:id/role     → 역할 변경
DELETE /api/admin/members/:id          → 회원 삭제

GET    /api/admin/photos               → 전체 사진 (page, size, memberId, colorMood, sort)
DELETE /api/admin/photos/:id           → 사진 삭제

GET    /api/admin/inquiries            → 전체 문의 (page, size, memberId, isRead, shootType)
DELETE /api/admin/inquiries/:id        → 문의 삭제

GET    /api/admin/series               → 전체 시리즈 (page, size, memberId)
DELETE /api/admin/series/:id           → 시리즈 삭제

GET    /api/admin/system/status        → 메일 설정 상태, Rate Limit 설정값
```

---

## 5. Frontend 라우팅 계획

```
/login              → 관리자 로그인 (현재 login.html → React 페이지로 전환 필요)
/                   → DashboardPage (요약 카드 + 차트)
/members            → MemberListPage
/members/:id        → MemberDetailModal (DashboardPage 내 모달)
/photos             → PhotoListPage
/inquiries          → InquiryListPage
/series             → SeriesListPage
/stats              → StatsPage (그래프/차트)
/system             → SystemPage
```

---

## 6. 구현 순서 (권장)

### Step 1 — 기반 작업
- [x] Admin Backend: DB 연결 설정 (`application-prod.properties` → happiness-app 동일 PostgreSQL)
- [x] Admin Backend: happiness-app 엔티티 동기화 (Member, Photo, Inquiry, Series, SeriesPhoto)
- [x] Admin Backend: JWT 인증 필터 (happiness-app과 동일 secret으로 검증)
- [x] Admin Frontend: 로그인 페이지 React 전환 + AuthContext 구성
- [x] Admin Frontend: Sidebar 레이아웃 컴포넌트

### Step 2 — 핵심 CRUD 페이지 (1순위)
- [x] `GET /api/admin/stats/summary` + DashboardPage 카드
- [x] MemberListPage + 역할 변경/삭제
- [x] PhotoListPage + 삭제
- [x] InquiryListPage + 필터/삭제

### Step 3 — 통계 (2순위)
- [x] `GET /api/admin/stats/daily` + 꺾은선 그래프
- [x] `GET /api/admin/stats/top-photos` + 인기 사진 테이블
- [x] 무드 분포 / 촬영 종류 분포 차트

### Step 4 — 나머지
- [x] SeriesListPage
- [x] SystemPage (메일/Rate Limit 상태)
- [x] 페이지네이션 공통 컴포넌트

---

## 7. 주의사항

### DB 연결
- Admin Backend는 happiness-app DB에 **읽기 + 제한적 쓰기(삭제/역할변경)** 권한만 사용
- `ddl-auto: validate` 고정 — Admin에서 스키마 변경 금지
- 삭제 시 cascade 순서 반드시 지킬 것:
  - 사진 삭제: `photo_likes → photo_saves → photo_shares → photo_tags → series_photos → photos`
  - 회원 삭제: 위 순서 + `series → inquiries → members`

### 보안
- Admin 접근은 `ROLE_WM` 또는 `ROLE_SA`만 허용 (happiness-app과 동일 JWT secret 사용)
- CORS: Admin Frontend 도메인만 허용 (`admin.example.com`)
- 운영 배포 시 Admin 포트(8081)는 퍼블릭 노출 최소화

### 차트 라이브러리
- **Recharts** 권장 (React 친화적, 번들 크기 작음)
- 설치: `npm install recharts`
- 외부 아이콘 라이브러리 없이 이모지 사용 (happiness-app 규칙 동일 적용)

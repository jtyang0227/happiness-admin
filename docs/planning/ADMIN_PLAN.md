# Happiness Admin — 대시보드 구현 기획서

> 최초 작성: 2026-06-11
> **최종 업데이트: 2026-06-29** — master 브랜치 병합 완료 기준
> 연동 앱: [happiness-app](https://github.com/jtyang0227/happiness-app)
> 목적: happiness-app에서 쌓인 데이터를 관리자가 한눈에 보고 제어할 수 있는 어드민 대시보드

---

## 📋 구현 범위 요약

| 페이지 | 우선순위 | 핵심 기능 | 상태 |
|--------|----------|-----------|------|
| **대시보드 홈** | 🔴 1순위 | 요약 카드, 최근 문의, 인기 사진, StatCard 링크 | ✅ 완료 |
| **회원 목록** | 🔴 1순위 | 목록/검색, 상태 칩 필터, 아바타, 역할 변경, 정지(기간 선택), 삭제 | ✅ 완료 |
| **회원 상세** | 🔴 1순위 | KPI 카드, 슬라이딩 탭, 히어로 프로필, 정지 모달 | ✅ 완료 |
| **사진 관리** | 🔴 1순위 | 마소니 그리드, 키워드 검색, 5단계 카테고리 필터, 삭제 | ✅ 완료 |
| **포트폴리오** | 🔴 1순위 | 목록, SlideOver 심사·승인·반려·숨기기·삭제, 아이템 정렬 링크 | ✅ 완료 |
| **문의 관리** | 🔴 1순위 | 전체 문의 목록, 읽음/전체읽음/삭제, 미읽음 행 강조 | ✅ 완료 |
| **통계** | 🟡 2순위 | 업로드 추이, 인기 사진 TOP 10, 무드 분포, 촬영 종류 분포 | ✅ 완료 |
| **시리즈 관리** | 🟢 3순위 | 목록/검색, 삭제, 사진 정렬 링크 | ✅ 완료 |
| **신고 관리** | 🟢 3순위 | 신고 목록, 처리 | ✅ 완료 |
| **공지사항** | 🟢 3순위 | CRUD | ✅ 완료 |
| **배너 관리** | 🟢 3순위 | CRUD | ✅ 완료 |
| **작가 인증** | 🟢 3순위 | 인증 요청 목록, 승인/반려 | ✅ 완료 |
| **갤러리 순서** | 🟢 3순위 | 갤러리 노출 순서 편집 | ✅ 완료 |
| **피처드** | 🟢 3순위 | 피처드 아이템 관리 | ✅ 완료 |
| **콘텐츠 정책** | 🟢 3순위 | 정책 설정 | ✅ 완료 |
| **정렬 관리** | 🟢 3순위 | 사진·시리즈·시리즈별사진·포트폴리오아이템 드래그 정렬 | ✅ 완료 |
| **시스템 설정** | 🟢 3순위 | 메일 설정 상태, Rate Limit 확인 | ✅ 완료 |

---

## 1. 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React 18, React Router v6 (포트 3001) |
| Backend | Spring Boot 3.5, Java 21, Gradle 8.14.4 (포트 8081) |
| DB (dev) | H2 in-memory |
| DB (prod) | happiness-app과 **동일한 PostgreSQL** 연결 |
| 보안 | Spring Security 6 + JWT |
| 차트 | Recharts 3 |
| 아이콘 | lucide-react |
| 토스트 | react-hot-toast |
| CI/CD | GitHub Actions (`.github/workflows/ci.yml`) |

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

**운영 환경변수:**
```bash
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=<happiness-app과 동일한 시크릿>
```

---

## 3. Backend API 설계

모든 `/api/admin/**` 엔드포인트는 `ROLE_WM` 또는 `ROLE_SA` JWT 필요.

### 인증
```
POST /api/auth/login  → { email, password } → JWT 발급
```

### 대시보드 통계
```
GET  /api/admin/stats/summary           → 요약 카드 4개
GET  /api/admin/stats/daily?days=N      → 일별 추이
GET  /api/admin/stats/top-photos        → 인기 사진 TOP 10
GET  /api/admin/stats/mood-dist         → 무드 분포
GET  /api/admin/stats/shoot-type-dist   → 촬영 종류 분포
```

### 회원
```
GET    /api/admin/members               → 목록 (search·authority·status·page·size)
GET    /api/admin/members/:id           → 상세 (photoCount·seriesCount·inquiryCount·portfolioCount)
PATCH  /api/admin/members/:id/role      → { authority: WM|SA|US }
PATCH  /api/admin/members/:id/status    → { status, reason, suspendDays? }
DELETE /api/admin/members/:id           → 삭제 (ROLE_WM 전용)
```

**suspendDays 규칙:**
- `3` / `7` / `30` → n일 후 자동 해제 (`suspendUntil = now + n days`)
- `0` 또는 생략 → 영구 정지 (`suspendUntil = null`)

### 사진
```
GET    /api/admin/photos                → 목록 (memberId·colorMood·l1~l5·search·sortBy·page·size)
DELETE /api/admin/photos/:id            → 삭제
PATCH  /api/admin/photos/:id/category-code → { categoryCode }
PUT    /api/admin/photos/reorder        → [{ id, displayOrder }]
```

### 포트폴리오
```
GET    /api/admin/portfolios            → 목록 (status·visibility·search·page·size)
GET    /api/admin/portfolios/stats      → 상태별 카운트 { DRAFT, PENDING, APPROVED, REJECTED }
PATCH  /api/admin/portfolios/:id/approve → { adminNote }
PATCH  /api/admin/portfolios/:id/reject  → { adminNote }
PATCH  /api/admin/portfolios/:id/hide
DELETE /api/admin/portfolios/:id
```

### 문의
```
GET    /api/admin/inquiries             → 목록 (senderId·receiverId·isRead·shootType·page·size)
PATCH  /api/admin/inquiries/:id/read    → 읽음 처리
PATCH  /api/admin/inquiries/read-all    → 전체 읽음
DELETE /api/admin/inquiries/:id
```

### 시리즈
```
GET    /api/admin/series                → 목록 (memberId·search·page·size)
DELETE /api/admin/series/:id
```

### 정렬 관리
```
GET/PUT /api/admin/sort/photos                  → 전체 사진 순서
GET/PUT /api/admin/sort/series                  → 전체 시리즈 순서
GET/PUT /api/admin/sort/series/:id/photos       → 시리즈별 사진 순서
GET/PUT /api/admin/sort/portfolios/:id/items    → 포트폴리오 아이템 순서
```

정렬 저장 페이로드: `[{ id: Long, displayOrder: Int }]`

### 기타
```
GET /api/admin/system/status    → 시스템 상태
GET /api/admin/categories       → 카테고리 5단계 트리
```

---

## 4. Frontend 라우팅

```
/login                → 관리자 로그인
/                     → 대시보드 (요약 카드 + 바 차트)
/members              → 회원 목록
/members/:id          → 회원 상세 (Cosmos×Pinterest 디자인)
/photos               → 사진 관리
/portfolios           → 포트폴리오 관리
/series               → 시리즈 관리
/inquiries            → 문의 관리
/stats                → 통계
/reports              → 신고 관리
/notices              → 공지사항
/banners              → 배너 관리
/verifications        → 작가 인증
/gallery-order        → 갤러리 순서
/featured             → 피처드
/content-policy       → 콘텐츠 정책
/system               → 시스템 설정
/sort/photos          → 사진 드래그 정렬
/sort/series          → 시리즈 드래그 정렬
/sort/series/:id      → 시리즈별 사진 정렬
/sort/portfolios/:id  → 포트폴리오 아이템 정렬
```

---

## 5. 디자인 시스템 (Cosmos × Pinterest 퓨전)

| Reference | DNA | Key Elements |
|---|---|---|
| **Pinterest** | Light mode base, warm neutrals | Pin Red (#E60023), cream bg, masonry |
| **Cosmos** | Dark mode DNA, minimal | Pure black (#000000), underline tabs, collage |

### CSS 변수 주요 값
```css
/* Light */
--color-brand:   #E60023;  /* Pin Red */
--color-bg:      #FAFAF8;
--color-surface: #FFFFFF;

/* Dark */
--color-brand:   #FF4455;
--color-bg:      #000000;
--color-surface: #111111;
```

### 구현 패턴
| 패턴 | 방식 |
|---|---|
| 마소니 그리드 | CSS `column-count` (JS 라이브러리 금지) |
| 이미지 reveal | `filter: blur(4px) → 0` on `onLoad` |
| 스크롤 진입 | `IntersectionObserver` + `.visible` 클래스 |
| 슬라이딩 탭 | `offsetLeft + offsetWidth` 측정 |
| 정지 기간 선택 | period-chip (3일·7일·30일·영구) |

---

## 6. 데이터 모델 주요 필드

### Member
```java
MemberStatus status;       // ACTIVE | INACTIVE | SUSPENDED | DELETED
String suspendReason;
LocalDateTime suspendUntil; // null = 영구
LocalDateTime suspendedAt;
Long suspendedById;
Boolean isVerified;
String provider;           // local | kakao | google 등
```

### Photo / Series / SeriesPhoto / PortfolioItem
```java
Integer displayOrder; // 0 = 미설정(createdAt DESC fallback), ≥1 = 정렬값
```

### AdminMemberDto (상세 응답)
```java
long photoCount;
long seriesCount;
long inquiryCount;
long portfolioCount;  // PortfolioRepository.countByMemberId() 집계
String provider;
```

---

## 7. 주의사항

### displayOrder 정렬 규칙
```jpql
ORDER BY CASE WHEN m.displayOrder = 0 THEN 1 ELSE 0 END ASC,
         m.displayOrder ASC,
         m.createdAt DESC
```

### 보안
- 회원 삭제 (`DELETE /members/:id`): `@PreAuthorize("hasRole('WM')")` 적용
- 모든 admin 엔드포인트: `ROLE_WM` 또는 `ROLE_SA` 필요
- CORS: Admin Frontend 도메인만 허용

### DB cascade 순서 (삭제 시)
- 사진 삭제: `photo_likes → photo_saves → photo_shares → photo_tags → series_photos → photos`
- 회원 삭제: 위 순서 + `series → portfolios → inquiries → members`

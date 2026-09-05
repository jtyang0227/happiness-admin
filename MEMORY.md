# MEMORY.md — happiness-admin 빠른 참조

> 세션 시작 시 빠르게 컨텍스트를 복원하기 위한 핵심 요약본.
> 상세 내용은 `CLAUDE.md` 참조.
>
> 문서 폴더: `docs/design/` (디자인 스펙) · `docs/planning/` (기획서/스펙)

---

## 프로젝트 기본 정보

| 항목 | 값 |
|---|---|
| 백엔드 포트 | `8081` (Spring Boot) |
| 프론트엔드 포트 | `3001` (React CRA) |
| DB | H2 in-memory (`jdbc:h2:mem:happinessadmindb`) |
| H2 콘솔 | `localhost:8081/h2-console` |
| 개발 계정 | `admin@happiness.dev` / `Admin123!` |
| 현재 브랜치 | `master` |

---

## 빌드 명령 (Quick Reference)

```bash
# 백엔드
cd backend
./gradlew clean build          # 빌드 + 테스트
./gradlew clean build -x test  # 테스트 스킵
./gradlew bootRun              # 개발 서버 실행

# 프론트엔드
cd frontend
npm install && npm start       # 개발 서버 (port 3001)
npm run build                  # 프로덕션 빌드
```

---

## CI/CD (GitHub Actions)

- 파일: `.github/workflows/ci.yml`
- 트리거: `push` → main / develop / `claude/**`, `PR` → main / develop
- Backend Job: Java 21 Temurin + Gradle 8.14.4
- Frontend Job: Node.js 20 + `npm ci` + `npm run build` (`CI=false`)

**핵심 주의사항**
- `backend/gradle.properties`에 `org.gradle.java.home` 절대 하드코딩 금지
  → CI 러너 Java 경로와 불일치하여 즉시 빌드 실패
  → 로컬 JDK 경로는 `~/.gradle/gradle.properties`에만 설정

---

## 구현 완료 페이지 (전체)

| 경로 | 페이지 | 상태 |
|---|---|---|
| `/` | 대시보드 (요약 카드 + 차트) | ✅ |
| `/members` | 회원 목록 (SuspendModal·avatar·IntersectionObserver) | ✅ |
| `/members/:id` | 회원 상세 (KPI·슬라이딩 탭·포트폴리오 탭) | ✅ |
| `/photos` | 사진 목록 (5단계 카테고리 필터·마소니 그리드) | ✅ |
| `/portfolios` | 포트폴리오 (SlideOver 심사·아이템 정렬 링크) | ✅ |
| `/series` | 시리즈 목록 | ✅ |
| `/inquiries` | 문의 목록 (읽음 처리·삭제) | ✅ |
| `/stats` | 통계 (꺾은선·파이·바 차트) | ✅ |
| `/reports` | 신고 관리 | ✅ |
| `/notices` | 공지사항 | ✅ |
| `/banners` | 배너 관리 | ✅ |
| `/popups` | 팝업 관리 | ✅ |
| `/verifications` | 작가 인증 | ✅ |
| `/bookings` | 예약 관리 | ✅ |
| `/featured` | 피처드 | ✅ |
| `/content-policy` | 콘텐츠 정책 | ✅ |
| `/system` | 시스템 상태 | ✅ |
| `/sort/photos` | 사진 드래그 정렬 | ✅ |
| `/sort/series` | 시리즈 드래그 정렬 | ✅ |
| `/sort/series/:id` | 시리즈별 사진 정렬 | ✅ |
| `/sort/portfolios/:id` | 포트폴리오 아이템 정렬 | ✅ |

---

## API 엔드포인트 요약

### 인증
| 경로 | 역할 |
|---|---|
| `POST /api/auth/login` | JWT 발급 |

### 회원
| 경로 | 역할 |
|---|---|
| `GET /api/admin/members` | 회원 목록 (search·authority·status·page) |
| `GET /api/admin/members/:id` | 회원 상세 (photoCount·seriesCount·inquiryCount·portfolioCount) |
| `PATCH /api/admin/members/:id/role` | 역할 변경 |
| `PATCH /api/admin/members/:id/status` | 상태 변경 — `{ status, reason, suspendDays }` |
| `DELETE /api/admin/members/:id` | 회원 삭제 (WM 전용) |

### 사진
| 경로 | 역할 |
|---|---|
| `GET /api/admin/photos` | 사진 목록 (memberId·colorMood·l1~l5·search·sortBy) |
| `DELETE /api/admin/photos/:id` | 사진 삭제 |
| `PATCH /api/admin/photos/:id/category-code` | 카테고리 코드 수정 |

### 포트폴리오
| 경로 | 역할 |
|---|---|
| `GET /api/admin/portfolios` | 포트폴리오 목록 |
| `GET /api/admin/portfolios/stats` | 상태별 카운트 |
| `PATCH /api/admin/portfolios/:id/approve` | 승인 |
| `PATCH /api/admin/portfolios/:id/reject` | 반려 |
| `PATCH /api/admin/portfolios/:id/hide` | 비공개 전환 |
| `DELETE /api/admin/portfolios/:id` | 삭제 |

### 문의
| 경로 | 역할 |
|---|---|
| `GET /api/admin/inquiries` | 문의 목록 (senderId·receiverId·isRead·shootType) |
| `PATCH /api/admin/inquiries/:id/read` | 읽음 처리 |
| `PATCH /api/admin/inquiries/read-all` | 전체 읽음 |
| `DELETE /api/admin/inquiries/:id` | 삭제 |

### 정렬
| 경로 | 역할 |
|---|---|
| `GET/PUT /api/admin/sort/photos` | 사진 정렬 (전체 또는 `?memberId=`로 작가별 범위) — 사진 순서 저장은 이 엔드포인트로 통일(작가별로 저장해도 전역 displayOrder 값 재사용, 다른 작가 순서 불변) |
| `GET/PUT /api/admin/sort/series` | 전체 시리즈 정렬 |
| `GET/PUT /api/admin/sort/series/:id/photos` | 시리즈별 사진 정렬 |
| `GET/PUT /api/admin/sort/portfolios/:id/items` | 포트폴리오 아이템 정렬 |

### 기타
| 경로 | 역할 |
|---|---|
| `GET /api/admin/stats/summary` | 홈 요약 카드 |
| `GET /api/admin/stats/daily` | 일별 추이 |
| `GET /api/admin/stats/top-photos` | 인기 사진 TOP 10 |
| `GET /api/admin/stats/mood-dist` | 무드 분포 |
| `GET /api/admin/stats/shoot-type-dist` | 촬영 종류 분포 |
| `GET /api/admin/system/status` | 시스템 상태 |
| `GET /api/admin/categories` | 카테고리 트리 |

---

## 회원 정지 (suspendDays) 스펙

```json
PATCH /api/admin/members/:id/status
{ "status": "SUSPENDED", "reason": "운영 정책 위반", "suspendDays": 7 }
```

- `suspendDays: 3` → 3일 정지
- `suspendDays: 7` → 7일 정지
- `suspendDays: 30` → 30일 정지
- `suspendDays: 0` 또는 `null` → 영구 정지
- 해제: `{ "status": "ACTIVE" }`

---

## 디자인 시스템 핵심 규칙

현재(6차) 컨셉: **Toss** — 흰 캔버스 + 파랑 하나, 둥근 모서리와 소프트 섀도우.
상세: `docs/design/TOSS_DESIGN_SPEC.md`.

- 색상은 반드시 `var(--color-*)` CSS 변수만 사용 (하드코딩 금지)
- 다크모드 자동 지원 — CSS 변수 시스템으로 처리 (라이트/다크 모두 옅은 회색 보더 유지, 반전 없음)
- 둥근 모서리 사용 — `var(--radius-*)` 사용, `0`으로 하드코딩 금지
- 이미지는 `onLoad` 시 `filter: blur(4px) → blur(0)` blur reveal 적용
- 마소니 레이아웃: CSS `column-count` 방식만 사용 (Masonry.js 금지)
- 카드 진입 애니메이션: `IntersectionObserver` + fade + slide up
- 폰트: Pretendard 단일 체계 (`--font-pixel`/`--font-serif`는 `--font-sans` 별칭, 전용 디스플레이 서체 없음)
- 로고: `frontend/src/assets/logo.png`(투명 배경, 검정 글자) — 다크 사이드바 위에서는 `filter: invert(1)`로 반전(사이드바는 테마 무관 항상 다크)

### 브랜드 색상
| 모드 | brand | accent(sky) | bg | surface |
|---|---|---|---|---|
| Light | `#3182F6` | `#0EA5E9` | `#F2F4F6` | `#FFFFFF` |
| Dark | `#4C8FFF` | `#38BDF8` | `#14181D` | `#1B2027` |

---

## displayOrder 정렬 규칙

- `displayOrder = 0` → 미설정 상태 (createdAt DESC로 fallback)
- `displayOrder >= 1` → 오름차순 정렬, 0인 항목보다 앞에 표시
- JPQL: `ORDER BY CASE WHEN displayOrder = 0 THEN 1 ELSE 0 END ASC, displayOrder ASC, createdAt DESC`
- 저장 페이로드: `[{id, displayOrder: idx+1}]` (1-indexed)

---

## 주요 컴포넌트 / 훅

| 이름 | 위치 | 역할 |
|---|---|---|
| `useDragSort` | `hooks/useDragSort.js` | HTML5 DnD 정렬, `toReorderPayload()` 제공 |
| `SlideOver` | `components/common/SlideOver` | 우측 패널, ESC 닫기, body scroll lock |
| `useConfirm` | `context/ConfirmContext` | 전역 확인 다이얼로그 |
| `putApi` | `utils/api.js` | PUT 요청 (정렬 저장 시 사용) |
| `ImgWithFallback` | `components/common` | 이미지 fallback + blur reveal |
| `SuspendModal` | `MemberListPage` / `MemberDetailPage` | 정지 기간 칩 + 사유 입력 모달 |
| `KpiCard` | `MemberDetailPage` | IntersectionObserver 진입 애니메이션 KPI 카드 |

---

## MemberDetailPage 디자인

- **히어로 카드**: 컬러 아바타 + 상태 링 + 인증 배지 + 정지 배너
- **KPI 그리드**: 사진·시리즈·문의·포트폴리오 — IntersectionObserver fade+slide
- **슬라이딩 탭**: `.mdp-tab-indicator` JS로 offsetLeft/offsetWidth 측정
- **탭 구성**: 활동 요약 / 사진 / 시리즈 / 포트폴리오 / 문의
- **CSS prefix**: `.mdp-*` 전용 네임스페이스

---

## AI 역할 분담

| AI | 역할 |
|---|---|
| **Pomelli** | 기획 — 요구사항·플로우 설계 |
| **Stitch** | 디자인 — UI/UX·디자인 시스템 |
| **AI Studio** | 자동화 — 스크립트·워크플로우 |
| **Claude Code** | 구현 — 백엔드·프론트엔드 코드·빌드·커밋 |

---

## Working Rules (요약)

1. 코드 작성 후 반드시 **빌드 검증** (`./gradlew build` / `npm run build`) 후 커밋
2. 검증 실패 시 먼저 수정 → 재검증 → 커밋
3. 기획 요청 = 스펙 문서 + 백엔드 + 프론트엔드 + 디자인 end-to-end 구현

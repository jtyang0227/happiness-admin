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
| 브랜치 | `claude/admin-planning-doc-120dha` |

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

## API 엔드포인트 요약

| 경로 | 역할 |
|---|---|
| `POST /api/auth/login` | JWT 발급 |
| `GET /api/admin/members` | 회원 목록 |
| `GET /api/admin/members/:id` | 회원 상세 |
| `PATCH /api/admin/members/:id/status` | 정지 / 해제 |
| `GET /api/admin/photos` | 사진 목록 (`memberId` 필터 가능) |
| `GET /api/admin/series` | 시리즈 목록 (`memberId` 필터 가능) |
| `GET /api/admin/portfolios` | 포트폴리오 목록 |
| `PATCH /api/admin/portfolios/:id/approve` | 포트폴리오 승인 |
| `PATCH /api/admin/portfolios/:id/reject` | 포트폴리오 반려 |
| `GET /api/admin/inquiries` | 문의 목록 (`senderId`·`receiverId` 필터 가능) |
| `GET /api/admin/sort/photos` | 사진 정렬 조회 |
| `PUT /api/admin/sort/photos` | 사진 순서 저장 |
| `GET /api/admin/sort/series` | 시리즈 정렬 조회 |
| `PUT /api/admin/sort/series` | 시리즈 순서 저장 |
| `GET /api/admin/sort/series/:id/photos` | 시리즈별 사진 정렬 조회 |
| `PUT /api/admin/sort/series/:id/photos` | 시리즈별 사진 순서 저장 |
| `GET /api/admin/sort/portfolios/:id/items` | 포트폴리오 아이템 정렬 조회 |
| `PUT /api/admin/sort/portfolios/:id/items` | 포트폴리오 아이템 순서 저장 |

---

## 프론트엔드 라우트

| 경로 | 페이지 |
|---|---|
| `/login` | 로그인 |
| `/` | 대시보드 |
| `/members` | 회원 목록 |
| `/members/:id` | 회원 상세 |
| `/photos` | 사진 목록 |
| `/inquiries` | 문의 목록 |
| `/series` | 시리즈 목록 |
| `/portfolios` | 포트폴리오 목록 |
| `/sort/photos` | 사진 드래그 정렬 |
| `/sort/series` | 시리즈 드래그 정렬 |
| `/sort/series/:id` | 시리즈별 사진 정렬 |
| `/sort/portfolios/:id` | 포트폴리오 아이템 정렬 |
| `/stats` | 통계 |
| `/system` | 시스템 상태 |

---

## 디자인 시스템 핵심 규칙

- 색상은 반드시 `var(--color-*)` CSS 변수만 사용 (하드코딩 금지)
- 다크모드 자동 지원 — CSS 변수 시스템으로 처리
- 이미지는 `onLoad` 시 `filter: blur(4px) → blur(0)` blur reveal 적용
- 마소니 레이아웃: CSS `column-count` 방식만 사용 (Masonry.js 금지)
- 카드 진입 애니메이션: `IntersectionObserver` + fade + slide up
- 폰트: Pretendard Variable (CDN)

### 브랜드 색상
| 모드 | brand | bg | surface |
|---|---|---|---|
| Light | `#E60023` (Pin Red) | `#FAFAF8` | `#FFFFFF` |
| Dark | `#FF4455` | `#000000` | `#111111` |

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

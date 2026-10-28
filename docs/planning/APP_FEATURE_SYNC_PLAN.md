# App → Admin 기능 반영 기획 (2차)

> **작성**: 2026-10-20 · 기획(Pomelli 기준) → 구현(Claude Code)
> **분석 대상**: `jtyang0227/happiness-app` `main` @ `b6dcdb9` (2026-10-20)
> **선행 문서**: `APP_TO_ADMIN_SPEC.md`(2026-06-23, 낡음 — 예약·신고·정렬은 이미 구현됨)

## 1. 배경

App은 6월 이후 커뮤니티(댓글·팔로우·모임)와 작가 업무(작업 노트·큐레이션·무드보드·납품·미팅)
쪽으로 크게 확장됐다. 이 중 일부는 **App 내부의 `/admin/*` 화면**에만 붙어 있거나(에디터 추천),
아무런 운영 감독 수단이 없다(댓글, 모임 게시글). 운영 기능은 Admin 한 곳에 모은다는 원칙에 따라
그 격차를 메운다.

전제: 운영(prod)에서 Admin 백엔드는 App과 **같은 Postgres**를 본다(`application-prod.properties`,
`ddl-auto=update`). 따라서 Admin 엔티티는 App이 만든 **테이블·컬럼 이름을 그대로** 매핑해야 한다 —
새 테이블을 만들지 않고, 필요한 컬럼만 부분 매핑한다.

## 2. App 도메인 × Admin 현황 매트릭스

| App 도메인 | 운영 감독 필요성 | Admin 현황 | 판단 |
|---|---|---|---|
| series — 에디터 추천(`featuredAt`)·초안(`draft`) | **높음** — 탐색 상단 노출을 운영자가 결정 | 없음(App 내부 `/admin/curation`에만 존재) | **P0 구현** |
| comment — 사진 댓글·대댓글 | **높음** — 욕설·스팸 대응 수단 없음 | 없음 | **P0 구현** |
| gathering — 모임·참여자·모임 피드 | 중간 — 공개 모임 피드 게시글 모더레이션 | 없음 | **P1 구현**(목록·상세·게시글 삭제) |
| report | 높음 | 구현됨(AI 트리아지 포함) | 유지 — 단, App `reports` 스키마와 Admin `Report` 매핑이 다름(§6 리스크) |
| booking | 높음 | 구현됨 | 유지 |
| analytics | 중간 | 통계 페이지로 대체 | 유지 |
| tags | 낮음 | 없음 | **보류** — App 사진에 키워드 태그 컬럼이 없고, App의 태그 관리 화면도 목업(TODO). `photo_tags`는 인물 태그(위치 좌표)라 성격이 다름 |
| meet / delivery | 낮음 — 작가↔고객 간 사적 거래 데이터 | `/transactions` | **구현(Q4)** — 메타데이터만(상태·일자·정체/만료), 메시지·주소·토큰·피드백 미매핑, 읽기 전용 |
| moodboard / follow | 없음 — 개인 비공개 데이터 | 없음 | 대상 아님 |
| newsletter | 낮음 | `/newsletter` | **구현(Q3)** — 목록·집계·CSV 내보내기(활동 로그) |
| testimonial / press / achievement / pricing / brand | 중간 — 허위 후기·부적절 콘텐츠 | `/profile-content` | **구현(Q2)** — 종류별 점검·삭제 |
| audit(SecurityAuditLog) | 중간 | `/security-audit` | **구현(Q1)** — 읽기 전용 뷰어·로그인 실패 집계 |

## 3. P0-A 작업 큐레이션 (에디터 추천)

**목표**: 운영자가 공개 작업(시리즈)을 "에디터 추천"으로 올리고 내린다. App 탐색 작업 탭 상단
"✦ 에디터 추천" 띠에 `featured_at` 최근순으로 노출된다.

- **데이터**: `series.draft`(Boolean), `series.featured_at`(DateTime), `series.shoot_type`(30) — App과 동일 컬럼.
- **API**
  - `GET /api/admin/series/curation?featured=true|false&search=&page=&size=` — 초안 제외, 사진 1장 이상인 작업만.
  - `PUT /api/admin/series/{id}/featured` `{ "featured": true|false }` — 초안·사진 없는 작업은 400.
    `updated_at`을 건드리지 않도록 bulk UPDATE(App과 같은 이유: 탐색 "최신순"이 흔들리지 않게).
    변경은 `admin_activity_logs`에 남긴다(`CURATION_FEATURE` / `CURATION_UNFEATURE`).
- **화면** `/curation` (콘텐츠 그룹): 상단 세그먼트(추천 중 / 후보), 검색, 카드 그리드(표지·제목·작가·촬영 유형·사진 수·추천 시각).
  올리기 = 블랙 pill, 내리기 = danger, 둘 다 `useConfirm` 확인.

## 4. P0-B 댓글 관리

**목표**: 사진 댓글·대댓글을 검색하고 문제 댓글을 삭제한다.

- **데이터**: `comments`(photo_id, member_id, member_name, member_avatar_url, content, parent_id, created_at) — App과 동일.
- **API**
  - `GET /api/admin/comments?search=&photoId=&page=&size=` — 내용·작성자 검색, 사진 제목 함께 반환, 대댓글 수 포함.
  - `GET /api/admin/comments/counts` — 전체/오늘.
  - `DELETE /api/admin/comments/{id}` — 최상위 댓글이면 대댓글까지 함께 삭제(App `CommentService.deleteComment`와 동일 규칙). 활동 로그 `COMMENT_DELETE`.
- **화면** `/comments` (콘텐츠 그룹): KPI 2개, 검색, 테이블(작성자·내용·사진·구분(댓글/답글)·작성일·삭제).

## 5. P1 모임 관리

**목표**: 모임 현황을 보고, 모임 피드의 부적절한 게시글을 내린다. 모임 자체의 상태 전환·삭제는
참여자에게 영향이 커서 이번 범위에서 제외(App 배치가 상태를 자동 전환함).

- **데이터**: `gatherings`(부분 매핑), `gathering_participants`(gathering_id, status), `gathering_posts`.
- **API**
  - `GET /api/admin/gatherings?status=&search=&page=&size=` — 참여 확정 인원·게시글 수 포함.
  - `GET /api/admin/gatherings/{id}/posts`
  - `DELETE /api/admin/gatherings/posts/{postId}` — 활동 로그 `GATHERING_POST_DELETE`.
- **화면** `/gatherings` (운영·마케팅 그룹): 상태 필터(모집 중/모집 마감/예정/진행 중/종료), 테이블, 행 클릭 → SlideOver(모임 정보 + 피드 게시글 + 삭제).

## 6. 리스크 · 합의 필요

1. **스키마 드리프트**: Admin `Series.likes_count/view_count`, Admin `Report`(targetType 기반)는 App 테이블에 없는/다른 컬럼이다.
   `ddl-auto=update`가 NOT NULL 컬럼을 기존 행이 있는 테이블에 추가하려다 실패할 수 있다. 이번 작업은 새로 매핑하는
   컬럼을 전부 nullable로 두어 드리프트를 늘리지 않는다. 기존 드리프트 정리는 별도 과제.
2. **이중 운영 화면**: App 내부 `/admin/curation`과 Admin `/curation`이 공존한다. 데이터는 같은 컬럼이라 충돌은
   없지만, 운영 창구를 Admin으로 일원화하고 App 쪽 화면은 제거할지 결정 필요.
3. 댓글·게시글 삭제는 되돌릴 수 없다 — 확인 다이얼로그 + 활동 로그로 보완. 소프트 삭제는 App 스키마 변경이 필요해 보류.

## 7. 수용 기준

- [x] 세 화면이 상단 탭/레일에서 진입 가능, `qa-check.sh` 전 라우트 통과
- [x] 초안 작업 추천 시 400, 추천 후 목록 "추천 중"에 노출, 해제 후 후보로 복귀
- [x] 최상위 댓글 삭제 시 대댓글도 사라짐
- [x] 모임 게시글 삭제 후 SlideOver 목록·게시글 수 갱신
- [x] 세 동작 모두 시스템 > 활동 로그에 기록
- [x] 다크모드·모바일(390px) 레이아웃 확인

검증(2026-10-20): curl로 API 동작·에러 케이스 확인, `qa-check.sh` 22개 라우트 통과, agent-browser로 세 화면 조작·다크모드·390px 확인.

3차(2026-10-21, `WORK_QUEUE.md` Q1–Q6): 보안 감사 로그·프로필 콘텐츠·뉴스레터·미팅/납품 현황 추가 구현, 전 라우트 26개 QA 통과. 남은 보류: 태그 관리(데이터 모델 없음).

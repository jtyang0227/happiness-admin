# UI/UX 개선 설계서

> **작성**: Stitch (디자인)
> **작성일**: 2026-08-19
> **입력**: `docs/planning/UI_IMPROVEMENT_PLAN.md` (Pomelli, 2.1~2.13 + 우선순위표)
> **범위**: 각 문제 항목에 대한 화면 구조 · 컴포넌트 · 인터랙션 설계. 색상·폰트·모서리 반경 등
> 비주얼 토큰은 다루지 않음 — 4차 와도트(和ドット) 디자인 시스템(`docs/design/WA_DOT_DESIGN_SPEC.md`,
> `frontend/src/styles/tokens.css`) 그대로 사용.
> **방법**: 기획서 13개 항목 대응 실제 코드 리딩 — `pages/*.jsx` 15개, `components/common|dashboard|layout/*`,
> 백엔드 컨트롤러 8개(`AdminBooking`, `AdminSort`, `AdminPhoto`, `AdminReport`, `AdminPortfolio`,
> `AdminSeries`, `AdminMember`), `hooks/useDragSort.js`.

---

## 공통 원칙

새 화면은 전부 아래 기존 컴포넌트를 최우선으로 재사용한다. 신규 컴포넌트는 "정말 없는 것"만 제안한다.

| 기존 컴포넌트 | 위치 | 용도 |
|---|---|---|
| `Pagination` | `components/common/Pagination.jsx` | 목록 페이지네이션 |
| `SlideOver` | `components/common/SlideOver.jsx` | 우측 슬라이드 상세/심사 패널 (`open/onClose/title/footer/width`) |
| `ConfirmDialog` / `useConfirm()` | `context/ConfirmContext.jsx` | 파괴적 액션 확인 |
| `ImgWithFallback` | `components/common/ImgWithFallback.jsx` | 이미지 폴백 |
| `useDragSort` | `hooks/useDragSort.js` | 드래그 정렬 상태 머신 (`items, dragIdx, overIdx, isDirty, onDragStart/Over/Drop/End, toReorderPayload`) |
| `react-hot-toast` | — | 액션 결과 피드백 |
| `IntersectionObserver` 진입 애니메이션 | 각 페이지 개별 구현 중복 | 카드/행 리스트 스크롤 진입 |

목록 페이지의 로딩/빈 상태는 기존 관례를 그대로 따른다: 로딩은 `skeleton` 행 또는 `page-loading` 텍스트,
빈 상태는 아이콘 + 제목 + 설명 2단 구성(`PhotoListPage`·`PortfolioListPage`의 `.empty-state` 참고).

---

## 2.1 예약 관리(`/bookings`) 페이지 — Quick win(죽은 링크 처리) + 중기(페이지 신설)

### Quick win — 죽은 링크부터 차단

백엔드 상태 변경 API가 없는 현재, 두 가지 중 하나를 즉시 적용한다(설계자 권장: **B**).

- **A. 링크 비활성화**: `DashboardPage`의 KPI 카드(`오늘 예약`, `미확정 예약`) `to` prop과
  `BookingCalendar`/`WeeklyBookingList`의 "전체 보기" 링크를 제거하고 클릭 불가 상태로 표시.
  이미 보여주고 있는 조회용 위젯(달력 점, 주간 리스트)은 그대로 유지 — 백엔드 조회 API는 살아있으므로
  정보 자체는 죽지 않았다.
- **B. 임시 준비중 페이지 연결**(권장): `/bookings` 라우트를 `App.jsx`에 추가하고, 아래 "중기 — 페이지
  신설" 설계를 **조회 전용으로 최소 구현**해 바로 연결한다. 목록 API(`GET /admin/bookings`)가 이미
  있으므로 "준비 중" 안내보다 실제 조회 화면을 먼저 붙이는 쪽이 작업량 대비 임팩트가 크다. 즉, 이 Quick
  win은 중기 과제의 1단계(조회 전용)로 흡수한다.

### 중기 — `BookingListPage` 신설

기존 목록 페이지 패턴(`PortfolioListPage`, `MemberListPage`)을 그대로 따른다.

```
┌ page-header ───────────────────────────────────────────────┐
│ 예약 관리                                    총 128건        │
├ filter-bar ───────────────────────────────────────────────┤
│ [날짜 선택 📅]  [상태: 전체/REQUESTED/CONFIRMED/REJECTED ▾] │
├ table-card ───────────────────────────────────────────────┤
│ 신청자 │ 촬영작가 │ 촬영종류 │ 희망일 │ 장소 │ 예산 │ 상태 │ │
│ ...                                                          │
├ Pagination ───────────────────────────────────────────────┘
```

- **컬럼**: `AdminBookingDto` 필드 그대로 매핑 — `clientName`(신청자), `photographerName`+
  `photographerProfileName`(작가), `shootType`, `shootDate`, `shootLocation`, `budget`, `status`,
  `createdAt`. `status`는 `InquiryListPage`의 배지 패턴(`badge-green/red`) 대신 3색 배지
  (`REQUESTED`=warning, `CONFIRMED`=success, `REJECTED`=danger — 기존 `--color-warning/-success/-danger`
  토큰) 사용.
- **필터**: `date`(단일 날짜, `<input type="date">`) + `status`(`filter-select`) — 컨트롤러가 이미
  두 파라미터를 받으므로 그대로 매핑. `PortfolioListPage`처럼 `useSearchParams`로 필터를 URL에 반영해
  새로고침·뒤로가기 시 유지.
- **행 클릭**: `SlideOver`로 상세 패널 오픈. `message`, `rejectedReason`(있는 경우) 등 목록에 없는
  필드 노출. **상태 변경 액션은 백엔드 API가 없으므로 이번 단계에서는 버튼을 만들지 않는다** — 대신
  SlideOver 하단에 "상태 변경은 추후 지원 예정" 안내 문구만 둔다(기능을 약속하지 않는 것이 2.6의 교훈).
- **대시보드 연결 복원**: KPI 카드·캘린더·주간 리스트의 링크를 `/bookings?date=...&status=...`로
  복구해 실제 동작하는 딥링크로 되돌린다.
- **로딩/빈 상태**: 목록 페이지 표준(skeleton 행 / "등록된 예약이 없습니다").
- **반응형**: 다른 테이블 페이지와 동일하게 `table-card`에 `overflow-x: auto`만 있으면 충분(모바일
  전용 레이아웃은 장기 과제 "반응형 전수 검증"에서 다룸).
- **백엔드 의존성**: 없음(조회 API로 충분). 상태 변경까지 포함하려면 `PATCH /admin/bookings/{id}/status`
  신설이 별도 필요 — 이번 설계 범위 밖.

---

## 2.2 신고 대상 콘텐츠 확인 — Quick win(링크 전환) + 장기(전체 재설계 방향만)

### Quick win — 배지를 실제 리소스로 연결 + 검토 모달에 요약 미리보기

`ReportListPage`의 목록 컬럼과 검토 모달(`selected` 상태로 열리는 `.report-review-dialog`)을 손본다.

- **목록의 "대상 유형" 배지**: 현재 `<span className="notice-type-badge">{TARGET_LABELS[targetType]} #{targetId}</span>`
  텍스트만 있음 → 클릭 가능한 링크/버튼으로 전환.
  - `targetType === 'MEMBER'` → `navigate('/members/{targetId}')` (기존 `AdminMemberController`의
    `GET /{id}`가 이미 있어 백엔드 변경 없이 바로 연결 가능).
  - `targetType === 'PHOTO'` / `'SERIES'` → 사진·시리즈는 상세 페이지가 없고 목록 그리드 내
    `SlideOver` 클릭으로만 상세를 본다. 지금 구조상 정확한 딥링크가 없으므로, 검토 모달 내부의
    **인라인 미리보기**(아래)로 대체하고, 목록의 배지는 "미리보기 열기"로 동작(모달을 바로 연다).
- **검토 모달 상단에 대상 요약 카드 추가**(`review-info-grid` 위에 삽입):
  ```
  ┌ report-target-preview ───────────────────────┐
  │ [썸네일 64×64]  사진 제목                       │
  │                 작가명 · 업로드일               │
  │                 [회원 상세 보기 ↗] (MEMBER인 경우)│
  └────────────────────────────────────────────────┘
  ```
  `PhotoListPage`의 `photo-card` 요약 정보(썸네일·제목·작가)와 동일한 밀도로 구성하고, `ImgWithFallback`을
  그대로 재사용. `MEMBER` 신고는 이름·이메일·상태 배지(`MemberListPage`의 `AUTHORITY_COLORS`/
  `STATUS_COLORS` 재사용) + "회원 상세 보기" 버튼으로 `/members/:id` 이동.
- **로딩 상태**: 모달이 열리는 즉시 대상 상세를 fetch하는 동안 미리보기 카드 자리에 스켈레톤(64×64
  회색 블록 + 텍스트 바 2줄) 표시. 에러(대상이 이미 삭제된 경우) 시 "삭제된 콘텐츠입니다" 텍스트로
  대체 — 신고 처리 자체는 계속 가능해야 함(삭제된 콘텐츠에 대한 사후 조치일 수 있으므로).
- **백엔드 의존성**: `targetType=PHOTO`/`SERIES` 미리보기를 위해 **`GET /admin/photos/{id}`,
  `GET /admin/series/{id}` 단건 조회 엔드포인트가 현재 없다** — 신설 필요(둘 다 컨트롤러에 목록/삭제만
  있고 단건 GET이 없음을 코드로 확인). `MEMBER`는 기존 `GET /admin/members/{id}`로 즉시 커버된다.

### 장기 — 전체 워크플로우 재설계 (방향만)

Quick win은 "보이게" 만드는 데 그친다. 완전한 재설계는 신고 처리 이력(누가 언제 무슨 조치를 했는지)을
회원 상세·사진 상세와 연동된 활동 로그로 남기고, 대기 시간(SLA) 표시, 동일 대상에 대한 중복 신고
묶어 보기 등을 포함해야 한다. 이는 여러 신규 API와 데이터 모델(활동 로그 테이블)이 선행되어야 하는
별도 트랙이므로 본 설계에서는 다루지 않는다.

---

## 2.3 정렬 기능 진입점 통합 — 중기

### 진단부터: "사진 정렬" vs "갤러리 순서"는 실제로 충돌하는 기능이다

코드 확인 결과, 둘은 이름만 다른 게 아니라 **동일한 DB 컬럼(`Photo.displayOrder`)에 서로 다른 규칙으로
값을 쓴다**:

- `SortPhotosPage` → `PUT /admin/sort/photos` → `AdminSortService.reorderPhotos`: 전체 사진을 대상으로
  1부터 순번 부여.
- `GalleryOrderPage` → `PUT /admin/photos/reorder` → `AdminPhotoService.reorderPhotos`: 특정 작가로
  필터링한 부분집합 내에서 0부터 순번 부여, 같은 `displayOrder` 필드에 덮어씀.

즉 관리자가 "갤러리 순서"에서 작가 A의 사진을 정렬한 직후 "사진 정렬"에서 전체 정렬을 다시 저장하면
방금 지정한 작가별 순서가 전역 순번으로 덮어써진다(혹은 그 반대). **이것은 UX 통일 이전에 데이터
정합성 버그**이며, 통합 설계의 최우선 근거가 된다.

### 설계 방향: 하나의 화면, 범위(scope) 전환

`SortPhotosPage`를 확장해 상단에 범위 토글을 추가하고, `GalleryOrderPage`를 **폐기**(라우트·사이드바
메뉴 제거)한다.

```
┌ sp-header ────────────────────────────────────────────────┐
│ 🖼 사진 정렬 관리                                            │
│ 범위: (●) 전체 사진   ( ) 작가별 [작가 선택 ▾]               │
└──────────────────────────────────────────────────────────┘
```

- 범위가 "전체 사진"이면 기존 `/admin/sort/photos` 그대로.
- 범위가 "작가별"이면 작가 선택 후 `/admin/photos?memberId=&sortBy=displayOrder`로 조회하되,
  **저장 시에도 반드시 `/admin/sort/photos`(전역 displayOrder 스킴)로만 쓰도록 백엔드를 통일**한다 —
  즉 `AdminPhotoService.reorderPhotos`/`PUT /admin/photos/reorder` 엔드포인트는 제거하거나 내부적으로
  같은 서비스 로직을 호출하도록 합친다(작가 필터링된 화면이라도 실제로 쓰는 순번은 항상 전역 규칙을
  따라야 재생산 가능한 순서가 된다). 이 부분은 프론트 통합과 별도로 **백엔드 정합성 수정이 선행
  과제**임을 명시한다.
- UI 컴포넌트는 이미 존재하는 `SortPhotosPage`의 리스트/드래그/저장 바를 그대로 쓰고, 범위 토글만
  추가하면 되므로 구현량이 크지 않다.
- 사이드바에서는 "정렬 관리" 아코디언 안에 `사진 정렬`, `시리즈 정렬` 두 항목만 남기고(현재 상태 유지),
  독립 최상위 메뉴였던 "갤러리 순서"는 삭제한다. 시리즈 상세(`/sort/series/:id`)·포트폴리오 아이템
  (`/sort/portfolios/:id`)은 각자의 리스트 페이지(`SeriesListPage`, `PortfolioListPage`)에서 컨텍스트
  진입하는 현재 방식을 유지하되, **"정렬 관리" 그룹에 속한 기능이라는 시각적 힌트**로 사이드바 그룹
  트리거에 작은 배지("+2개 컨텍스트 정렬")를 붙이거나, 아코디언을 펼쳤을 때 "시리즈별/포트폴리오별
  아이템 정렬은 각 목록에서 진입하세요"라는 1줄 안내를 하위 텍스트로 추가해 학습 비용을 낮춘다(사이드바
  구조 자체를 바꾸는 전면 재편은 장기 과제로 미룸).

### 짧은 리스트 재배치 상호작용 통일

4개 화면(배너·팝업·피처드·+시리즈/포트폴리오 정렬)을 비교하면 이미 절반(`SortPhotosPage`,
`SortSeriesDetailPage`, `SortPortfolioPage`, `PopupPage`)이 **드래그 + `useDragSort` + dirty 배너 +
명시적 저장 버튼** 패턴으로 수렴해 있다. 나머지 절반(`BannerPage`, `FeaturedPage`)만
**상/하 화살표 버튼 + 클릭 즉시 자동저장**으로 남아 있다. 다수(4/6)이자 더 견고한 패턴(되돌리기 가능,
저장 전 검토 가능, 접근성 있는 드래그 핸들)인 전자로 통일한다.

- `BannerPage`, `FeaturedPage`를 `useDragSort` 기반으로 전환: 항목에 `GripVertical` 드래그 핸들 추가,
  `▲/▼` 버튼은 **키보드 접근성 대체 수단**으로는 유지(마우스 드래그가 어려운 사용자를 위해 — 순수
  장식적 중복 제거가 목적이 아니라 즉시 저장을 없애는 것이 목적이므로 버튼 자체는 남기되 클릭 시
  `isDirty`만 세우고 별도 저장 버튼을 눌러야 반영되도록 변경), 상단에 dirty 배너 + "저장/되돌리기"
  버튼 쌍을 공통 배치.
- 이 패턴을 매번 새로 작성하지 않도록, 리스트 껍데기(그립·번호·썸네일·정보·dirty 배너·저장 버튼)를
  `components/common/SortableList.jsx`(신규, 프레젠테이션 전용)로 뽑아내고 각 페이지는 렌더 함수만
  넘기는 구조를 제안한다. `useDragSort`는 상태 훅으로 그대로 두고, `SortableList`는 그 위의 뷰
  레이어만 담당 — 기존 5개 정렬 화면의 거의 동일한 JSX(스켈레톤, dirty 배너, 저장/초기화 버튼,
  `IntersectionObserver` 진입 애니메이션)를 중복 없이 재사용하기 위함.
- **인터랙션 디테일**: 드래그 시작 시 `dragging` 클래스로 반투명 처리, 드롭 대상 위 `drag-over` 클래스로
  상단 보더 하이라이트(기존 `sp-row.dragging/drag-over` 패턴 그대로), 저장 성공 시 토스트 + 리스트
  `displayOrder` 재계산.
- **백엔드 의존성**: 없음(기존 `PATCH /admin/banners/reorder`, `PATCH /admin/featured/reorder`
  엔드포인트가 이미 `orderedIds` 배열을 받으므로 프론트 상호작용만 바뀜).

### 장기 — 사이드바 정보구조 전면 재편

16개 최상위 메뉴가 평면 나열된 현재 구조는 도메인별 그룹(콘텐츠/회원/운영·마케팅/설정)으로 재편하는
편이 근본적이다. 다만 이는 전체 내비게이션에 영향을 주므로, 위 정렬 통합이 자리잡은 뒤 별도 IA
설계로 진행한다.

---

## 2.4 대시보드/상단바 하드코딩 지표 — Quick win

### 대시보드 KPI 증감률·진행률

`DashboardPage`의 `KpiCard`에 `progress={72}`, `change={12}` 같은 리터럴이 그대로 박혀 있다.
`StatsSummaryDto`에 기간 대비 계산치가 없으므로, 계산 근거가 없는 지표는 **표시 자체를 제거**한다(기획서
원칙 그대로: "가짜보다 없는 편이 낫다").

- `progress` prop과 `kpi-progress-track` 렌더 분기를 제거하거나, `totalMembers` 등 절대 상한이
  존재하지 않는 값(회원 수·사진 수에는 애초에 "72%"의 의미가 없다)에 대해서는 progress bar를
  완전히 뗀다.
- `change`(전일/전주 대비 증감률)는 `StatsSummaryDto` 확장 없이는 계산 불가하므로 1차로는 `null`
  처리해 `ChangeIndicator`가 아무것도 렌더링하지 않게 한다. 향후 백엔드가 `todayCount`/`yesterdayCount`
  같은 필드를 내려주면 그때 복원 — 이 설계서에서는 "제거"가 확정 방향이고 "실데이터 연결"은 백엔드
  작업이 선행되어야 하는 옵션으로만 남긴다.
- `KpiCard` 컴포넌트 자체의 시각 골격(아이콘·값·라벨·화살표)은 그대로 유지 — 빈 공간이 어색하지
  않도록 `progress`/`change`가 모두 없을 때도 카드 높이가 줄어들지 않게 `min-height`만 CSS로 고정.

### 상단바 "시스템 정상" 배지

`AdminTopbar.jsx`의 `topbar-status-dot--active` 클래스는 상수로 고정돼 있다. `SystemPage`가 이미
호출하는 헬스체크 API(`AdminSystemController` → `SystemStatusDto`)를 `AdminTopbar`에서도 호출한다.

- `AdminLayout` 또는 `AdminTopbar` 마운트 시 `getApi('/admin/system/status')` 1회 호출 + 폴링(예:
  60초 간격, `SystemPage`와 동일 소스이므로 과도한 폴링 지양) 후 상태에 따라 배지 색·라벨 전환:
  정상=`success`, 저하=`warning`, 장애=`danger`(토큰은 기존 `--color-success/-warning/-danger` 그대로).
- 배지 클릭 시 `/system`으로 이동하는 링크로 전환해, 이상 감지 시 바로 상세 확인 화면으로 갈 수
  있게 한다(현재는 클릭 불가 텍스트).
- **로딩 상태**: 최초 로드 전에는 회색 중립 점 + "확인 중" 라벨(현재 항상 초록으로 시작하는 것보다
  안전).
- **백엔드 의존성**: 없음(기존 API 재사용).

---

## 2.5 회원 상세 정보·액션 통합 — 중기

`MemberDetailPage`에 포트폴리오 탭 추가, 작가 인증 연결, 권한 변경 인라인화 3가지를 한 번에 다룬다.

### 포트폴리오 탭

`TABS` 배열에 `{ key: 'portfolios', label: '포트폴리오' }` 추가(KPI 그리드에는 이미
`member.portfolioCount`가 있으므로 탭만 비어 있던 상태). 렌더는 기존 `photos`/`series` 탭과 동일한
카드 그리드 패턴(`mdp-photos-grid` 재사용, 포트폴리오는 표지 이미지 + 제목 + 상태 배지로 구성 —
`PortfolioListPage`의 `pf-card` 축약형).

```
[사진 6장 그리드와 동일한 톤]
┌────────┐ ┌────────┐ ┌────────┐
│ 표지img │ │ 표지img │ │ 표지img │
│ 제목    │ │ 제목    │ │ 제목    │
│[승인]배지│ │[심사중] │ │[반려]   │
└────────┘ └────────┘ └────────┘
```

- 클릭 시 `PortfolioListPage`의 `SlideOver` 심사 패턴을 재사용할지, 아니면 `/portfolios?search=`로
  단순 이동할지는 두 옵션 모두 가능하나, 회원 상세에서 "그 자리에서 판단"하는 것이 2.5의 취지이므로
  **SlideOver를 회원 상세 페이지에도 그대로 이식**해 승인/반려까지 이 화면에서 끝낼 수 있게 한다
  (같은 `SlideOver` 컴포넌트 재사용, 승인/반려 API도 `PortfolioListPage`와 동일하게 호출).
- **백엔드 의존성**: 현재 `GET /admin/portfolios`에는 `memberId`/`authorId` 필터 파라미터가
  없음(코드로 확인: `status`, `visibility`, `search`, `page`, `size`뿐). **회원 필터 파라미터 추가가
  선행 필요** — 추가되면 `getApi('/admin/portfolios?memberId=${id}&size=6')` 형태로 다른 탭과
  동일하게 지연 로딩.

### 작가 인증 연결

"기본 정보" 카드의 "작가 인증" 행(`mdp-verified-text`/`mdp-unverified-text`)을 클릭 가능하게 만든다.

- 인증됨 상태: 클릭 시 아무 동작 없음(이미 승인 완료, 별도 조치 불필요) — 단, 인증일 옆에
  "인증 내역 보기" 텍스트 링크만 추가해 `/verifications?memberId=...`(신규 쿼리 파라미터, 아래)로 이동.
- 미인증 + 인증 신청이 존재하는 경우: "심사 대기 중 — 인증 관리에서 보기" 링크로
  `VerificationListPage`의 해당 신청 건으로 딥링크.
- **백엔드 의존성**: `VerificationListPage`가 소비하는 `GET /admin/verifications`에도 현재
  `status`, `page`, `size`만 있고 회원 식별 파라미터가 없다(그 페이지는 애초에 memberId로 필터링할
  일이 없었으므로). 딥링크를 정확히 구현하려면 `memberId` 또는 `search`(이름/이메일) 파라미터 추가가
  필요 — 간단한 대안으로는 **프론트에서만 `?search=<member.name>`을 붙여 이동**하는 임시 처리도
  가능하나, 동명이인 시 부정확하므로 신규 파라미터 쪽을 권장.

### 권한(역할) 변경 인라인화

`MemberListPage`의 `role-select` 배지 셀렉트(같은 UI: `<select className="role-select badge ...">`)를
`MemberDetailPage`의 히어로 영역 또는 "기본 정보" 카드의 "권한" 행에 그대로 이식.

- 변경 시 `MemberListPage`와 동일하게 `useConfirm()`으로 확인 다이얼로그 후
  `PATCH /admin/members/{id}/role` 호출 → 성공 시 `fetchMember()` 재호출로 상단 배지까지 갱신.
- **백엔드 의존성**: 없음(기존 API 재사용, 프론트 전용 변경).

---

## 2.6 커맨드 팔레트 실데이터 검색 — 중기

`CommandPalette.jsx`는 고정 배열 `COMMANDS`(16개 페이지 이름)만 `.includes()` 필터링한다. 최소
범위로 회원 검색 결과를 결과 그룹에 추가한다.

### 상호작용 설계

- 입력값이 2자 이상이면 페이지 필터링과 **별도로** `GET /admin/members?search=<query>&size=5`를
  300ms 디바운스 호출(기존 `PhotoListPage`/`PortfolioListPage`의 검색 디바운스 패턴과 동일하게
  `searchTimerRef` 사용).
- 결과는 기존 `cmd-group`("페이지") 아래에 새 그룹 **"회원"**으로 추가.
  ```
  🔍 [입력: "김민수"                    ]
  ─ 페이지 ───────────────
    (라벨에 "김민수"가 포함되는 페이지 없으면 그룹 자체 숨김)
  ─ 회원 (검색결과) ───────
    👤 김민수         member@email.com
    👤 김민수2세       member2@email.com
  ─────────────────────────
  ↑↓ 이동   Enter 선택   Esc 닫기
  ```
- 회원 결과 클릭/Enter 시 `/members/{id}`로 이동(페이지 결과와 동일하게 `onClose()` 동반).
- 키보드 네비게이션(`activeIdx`, `ArrowUp/Down`, `Enter`)은 기존 `filtered` 배열에 회원 결과를 이어
  붙이는 방식으로 확장하면 로직 변경이 최소화된다 — 그룹 구분은 라벨(`group: '회원'`)만 다르게 부여.
- **로딩 상태**: 회원 검색 중에는 "회원" 그룹 아래에 1줄 스피너 텍스트("검색 중...") — 페이지 필터링은
  동기 연산이라 로딩이 없지만 회원 검색은 네트워크 호출이므로 분리 표시 필요.
- **빈 상태**: 페이지·회원 결과가 모두 없을 때만 기존 `cmd-empty`("검색 결과가 없습니다") 노출.
- **플레이스홀더 문구 수정**: `AdminTopbar`의 `"페이지, 회원, 기능 검색..."`은 이제 실제로 진실이
  되므로 문구는 유지(오히려 지금까지 거짓 광고였던 것을 사실로 만드는 작업).
- **백엔드 의존성**: 없음(기존 `GET /admin/members?search=` 재사용). 사진·문의 확장은 사용 빈도를
  보고 추후 판단(기획서 원문 그대로 후속 과제로 유지).

---

## 2.7 문의 처리 상태 확장 — 중기

읽음/미읽음 2단계 대신 "처리 완료/보류" 같은 실제 처리 상태를 추가하려면 백엔드 상태값 확장이
선행돼야 하므로, 프론트 설계는 **백엔드 확장 시나리오**와 **프론트 단독으로 가능한 임시안** 둘을
모두 제시한다.

### 본안 — 상태 필드 확장 (백엔드 선행 필요)

- `Inquiry` 엔티티에 `processStatus` 같은 필드(`NEW` / `IN_PROGRESS` / `RESOLVED` / `ON_HOLD`) 추가를
  가정하고, `InquiryListPage`의 배지를 읽음 배지 옆에 **두 번째 배지**로 병기:
  ```
  상태 컬럼: [읽음] [처리중]   /   [미읽음] [신규]   /   [읽음] [완료]
  ```
- 필터 바에 `상태(처리)` 셀렉트를 `읽음/미읽음` 셀렉트 옆에 추가.
- 목록 행 확장(`expanded` 토글로 열리는 상세 영역, 기존 `inquiry-message`)에 상태 변경 셀렉트를
  인라인 배치(`role-select` 배지 셀렉트와 동일한 시각 패턴) — 관리자가 상세를 펼친 김에 바로 상태를
  바꿀 수 있게.
- 대시보드 "최근 문의 5건" 테이블(`DashboardPage`)도 동일 배지 체계를 따르도록 상태 컬럼 추가.

### 임시안 — 프론트 전용 메모 필드 (백엔드 변경 없이 가능)

백엔드 상태값 확장 전이라도 체감 개선이 필요하다면, `Inquiry`에 이미 있을 수 있는 자유 텍스트 필드가
없는 한 이 임시안도 결국 최소 1개 컬럼(`adminMemo` 등) 추가가 필요해 완전한 "프론트 전용"은 어렵다.
따라서 이 항목은 **경량 API 확장(상태 enum 필드 하나)이 사실상 필수**임을 설계 결론으로 명시하고,
프론트는 위 본안 구조를 그대로 채택할 것을 권장한다.

- **백엔드 의존성**: `Inquiry` 상태 필드 추가 + `AdminInquiryController`에 상태 변경 PATCH 엔드포인트
  신설. 프론트만으로 해결 가능한 범위가 아님을 명확히 한다.

---

## 2.8 사진 카테고리 코드 → 한글 라벨 — Quick win

`PhotoListPage`(카드), `SortPhotosPage`/`SortSeriesDetailPage`(정렬 목록)에서 원시 코드 노출을
사람이 읽을 수 있는 라벨로 교체한다. `PhotoListPage`는 이미 카테고리 API(`GET /admin/categories`)를
불러와 `cats` 상태로 갖고 있고 `l1Name`/`l2Name` 라벨도 일부 활용 중이므로, **완전히 새로운 데이터
소스 없이 매핑만 보강**하면 된다.

### `PhotoListPage` 카드

- 현재 `decodeCat()`은 `l1Name`/`l2Name`만 뽑아 배지로 보여주고, 카드 하단의 `photo-code`
  (`0101010101` 형태 10자리)는 그대로 노출된다. `photo-code` 자체를 **제거**하고, 대신 5단계 전체
  중 값이 있는 단계만 순서대로 라벨 배지로 나열(`l1Name~l5Name` 전부 응답에 포함되도록 백엔드 DTO
  확인 필요 — 현재 `l1Name`/`l2Name`만 쓰이는 것이 실제로 백엔드가 2단계까지만 내려주는 것인지,
  프론트가 2단계만 꺼내 쓰는 것인지 확인이 필요하다. 후자라면 프론트 수정만으로 충분).
- 원시 코드는 완전히 없애지 않고, 관리자가 "코드값 자체"를 확인해야 하는 경우(디버깅 등)를 위해
  `SlideOver` 상세 패널의 "확인 구분자(10자리)" 입력창 자리에만 유지 — 목록 카드에서는 라벨만.

### `SortPhotosPage` / `SortSeriesDetailPage` 목록

- `SortSeriesDetailPage`의 `sp-meta`에 `Photo ID: {sp.photoId}`가 그대로 노출되는 부분을 제거하고,
  대신 카테고리 1차 라벨(예: "웨딩") 배지로 교체 — `SortPhotoDto`/`SortSeriesPhotoDto`에 카테고리
  라벨 필드가 없다면 `getApi('/admin/categories')`를 정렬 페이지에서도 함께 불러와 코드→라벨
  매핑 테이블을 구성(이미 `PhotoListPage`가 쓰는 것과 동일한 API, 캐시 가능).
- `SortPhotosPage`의 `sp-badge sp-badge-unset`("미설정")은 그대로 유지 — 이건 코드가 아니라 상태
  표시이므로 문제 없음.
- **백엔드 의존성**: `SortPhotoDto`/`SortSeriesPhotoDto`에 라벨 필드가 이미 있는지 확인 필요. 없다면
  프론트에서 카테고리 API로 클라이언트 매핑(간단한 방법)하거나, DTO에 `l1Name` 필드를 추가하는 쪽
  중 택1 — 어느 쪽이든 Quick win 범위(표시 로직 변경) 안에서 해결 가능하다.

---

## 2.9 통계 파이 차트 범례 — Quick win

`StatsPage`의 "색채 무드 분포" `PieChart`는 조각 위 `label` 텍스트(`${label} ${percent}%`)만 있고
별도 범례가 없다. Recharts `<Legend />`는 `LineChart`(기간별 추이)에는 이미 쓰이고 있으므로 동일하게
추가한다.

- `<PieChart>` 내부에 `<Legend verticalAlign="bottom" height={36} formatter={(value, entry) => \`${entry.payload.label} (${entry.payload.count}개)\`} />` 추가. 색상은 이미 `CHART_COLORS` 8색 팔레트를 셀별로
  순환 배정하고 있으므로 그대로 연결.
- 조각 위 라벨(`percent%`)은 유지하되 항목 수가 많아질 경우(6개 초과) 겹침 방지를 위해
  `labelLine={false}` 유지 + 라벨 폰트 축소는 현행 유지.
- "촬영 종류별 문의" 가로 바 차트는 `YAxis`에 이미 카테고리명이 라벨로 붙어 있어 범례가 불필요 —
  파이 차트만 해당.
- **백엔드 의존성**: 없음(순수 프론트 렌더 변경, `moodDist` 응답 형태 `{label, count}` 그대로 사용).

---

## 2.10 대시보드 vs 통계 역할 재정의 — 장기 (방향만)

대시보드의 "최근 7일 업로드 차트 + 인기 TOP5"와 통계 페이지의 "기간별 추이 + 인기 TOP10"은 범위만
다른 동일 위젯이다. 방향은 "대시보드=오늘 당장 확인할 이상 신호·액션 필요 항목, 통계=기간별 추이 분석"
으로 역할을 분리하는 것이다. 대시보드 쪽 후보로는 미확정 예약 수, 미읽음 문의 수, 심사 대기 포트폴리오
같은 "지금 처리해야 할 것" 카운트가 더 어울리고, 추이 차트류는 통계 페이지로 완전히 이관하는 편이
자연스럽다. 다만 이는 두 페이지 전체의 정보구조를 다시 짜는 작업이라, 2.3(정렬 통합)·2.4(지표
신뢰성) 등 다른 개선이 먼저 자리잡은 뒤 별도 설계 라운드로 진행하는 것을 권장한다.

---

## 2.11 포트폴리오/시리즈 우선순위 정보 — 중기

### 포트폴리오 — 심사 대기 경과일

`PortfolioListPage`의 `pf-card`(그리드 카드)에 `createdAt`만 표시되고 있다. `status === 'PENDING'`인
카드에 한해 경과일 배지를 추가한다.

```
┌ pf-card (PENDING) ───────────┐
│ [표지 이미지]     [심사중]     │
│                  ⏱ 3일 경과   │  ← 신규 배지, 7일 초과 시 강조색
│ 제목 / 작가                    │
└───────────────────────────────┘
```

- 경과일은 `Math.floor((Date.now() - new Date(p.createdAt)) / 86400000)`로 프론트에서 계산 가능
  (별도 백엔드 필드 불필요 — `createdAt`이 이미 응답에 있음).
- 정렬 옵션(`sortBy` 셀렉트)에 `"대기 오래된 순"`(`status=PENDING`일 때만 노출) 추가 — 클라이언트
  정렬로 충분하면 프론트에서 `data.content`를 재정렬해 표시, 페이지네이션과 충돌한다면(서버 페이징
  중이므로) `sortBy=oldest`를 서버 파라미터로 넘기는 방식이 필요 — 후자가 정확하므로 **백엔드에
  `sortBy=pending_age` 정렬 옵션 추가를 권장**.
- 경과일이 7일을 넘는 카드는 배지 색을 `warning`→`danger`로 승격해 시각적으로 눈에 띄게 한다.

### 시리즈 — 참여도 지표

`SeriesListPage` 테이블에 좋아요/조회 컬럼이 없다(현재 커버·제목·작가·사진 수·생성일뿐). `Series`
엔티티/DTO에 참여도 필드가 없다면 신설이 필요 — 있다면(포트폴리오처럼 `likesCount`/`viewCount`가
이미 존재할 가능성) 컬럼만 추가.

- 테이블에 `❤ 좋아요` 컬럼 추가, 기본 정렬은 유지하되 헤더 클릭으로 정렬 방향 토글(기존 시리즈
  목록에 정렬 UI 자체가 없으므로, 최소 구현은 상단 `filter-bar`에 `정렬: 최신순/좋아요순` 셀렉트를
  포트폴리오 페이지와 동일한 패턴으로 추가).
- **백엔드 의존성**: `AdminSeriesDto`에 좋아요/조회 필드가 이미 있는지 확인 필요 — 없다면 필드 추가와
  정렬 파라미터(`sortBy=likes`) 지원이 선행 과제.

---

## 2.12 이미지 표시 안정성 — 장기 (방향만)

`ImgWithFallback`이 `onError` 폴백을 정상적으로 처리하고 있다는 것은 컴포넌트 자체는 문제가 없다는
뜻이고, 폴백이 "자주 발동한다"는 것은 시드 데이터의 이미지 URL 자체가 유효하지 않다는 데이터 문제일
가능성이 높다. UI 설계로 해결할 문제가 아니므로, 실제 운영 데이터(또는 유효한 CDN URL을 가진 시드
데이터)로 재검증 후에도 폴백 발생률이 높다면 그때 화면 설계(예: 스켈레톤 개선, lazy-load 지시자
강화)를 별도로 논의한다. 이번 설계에서는 손대지 않는다.

---

## 2.13 인증 사용자 404를 관리자 셸 안에서 렌더 — Quick win

`App.jsx`의 `<Route path="*" element={<NotFoundPage />} />`가 `ProtectedRoute`(=`AdminLayout`) 바깥에
있어 사이드바·헤더 없이 통째로 이탈한다. 인증 여부에 따라 분기한다.

```jsx
<Route path="*" element={
  <AuthedNotFound />   // user 있으면 AdminLayout으로 감싼 NotFoundPage, 없으면 /login 리다이렉트
} />
```

- 새 래퍼 컴포넌트(`AuthedNotFound`, `App.jsx` 내부 또는 `pages/NotFoundPage.jsx` 옆에 소규모 추가)는
  `useAuth()`로 `user` 존재 여부만 보고 `ProtectedRoute`와 동일하게 `AdminLayout`으로 `NotFoundPage`를
  감싸거나 미인증 시 `/login`으로 보낸다. 기존 `ProtectedRoute`를 그대로 재사용해도 무방
  (`<ProtectedRoute><NotFoundPage /></ProtectedRoute>`로 와일드카드 라우트를 교체하는 것이 가장 작은
  변경).
- `NotFoundPage.css`의 전체 화면 중앙 정렬 레이아웃은 `AdminLayout`의 콘텐츠 영역 안에서도 그대로
  작동하도록 `height: 100%`(뷰포트 100vh 대신) 정도만 조정.
- "홈으로 돌아가기" 버튼은 유지 — 사이드바가 이미 보이는 상태이므로 중복이지만 명시적 탈출 경로로서
  유효.
- **백엔드 의존성**: 없음(순수 라우팅 구조 변경).

---

## 부록 — 항목별 설계 난이도 · 백엔드 의존성 요약

| 항목 | 프론트 난이도 | 백엔드 선행 필요 |
|---|---|---|
| 2.1 예약 (조회 전용) | 중 (신규 페이지 1개) | 없음 |
| 2.2 신고 대상 링크 | 하(회원) / 중(사진·시리즈) | 사진·시리즈 단건 GET 신설 |
| 2.3 정렬 통합 | 중~상(범위 토글 + 공통 컴포넌트 추출) | **있음 — displayOrder 정합성 수정 필수** |
| 2.4 하드코딩 지표 제거 | 하 | 없음 |
| 2.5 회원 상세 통합 | 중 | 포트폴리오/인증 목록에 memberId 필터 추가 |
| 2.6 팔레트 회원 검색 | 하 | 없음 |
| 2.7 문의 처리 상태 | 중(프론트) | **있음 — 상태 필드·API 신설 필수** |
| 2.8 카테고리 라벨화 | 하 | 필드 확인만 |
| 2.9 파이 차트 범례 | 하 | 없음 |
| 2.11 우선순위 정보 | 중 | 필드/정렬 옵션 확인·추가 |
| 2.13 404 셸 유지 | 하 | 없음 |

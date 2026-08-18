# 和ドット (와도트) 디자인 시스템 — 구현 기록

Happiness Admin의 현재(2026-08-18) 적용 디자인 시스템. Pixel Arcade(네온 아케이드)를 잇는
4차 리뉴얼로, 최초 기획은 `docs/planning/JAPANESE_DOT_DESIGN_SPEC.md` 참고. 이 문서는 실제
구현된 as-built 상태를 기록한다.

## 컨셉 계보

| 단계 | 컨셉 |
|---|---|
| 1차 | Cosmos × Pinterest 퓨전 |
| 2차 | Railway DNA |
| 3차 | Pixel Arcade (네온 마젠타, 아케이드 게임기) |
| **4차 (현재)** | **和ドット — 전통 일본 색채 × JRPG 대화창 미학** |

## 팔레트

| 이름 | 한자 | 역할 | Light | Dark |
|---|---|---|---|---|
| 아이이로 | 藍色 | 배경(다크) · 딥 서피스 | — | `#0F1B2A` / `#16283B` |
| 기나리 | 生成り | 배경(라이트) · 보더(다크) | `#F1E9D8` / `#FBF6EA` | `#F1E9D8` |
| 스미 | 墨 | 텍스트 · 보더(라이트) | `#1C1B19` | — |
| 슈이로 | 朱色 | 브랜드 · CTA | `#C7361B` | `#E2571C` |
| 와카타케이로 | 若竹色 | 성공 | `#3F8A57` | `#6BBF82` |
| 야마부키이로 | 山吹色 | 경고 | `#B8791E` | `#F2B84D` |
| 베니 | 紅 | 위험 | `#A82530` | `#E0454C` |
| 아사기이로 | 浅葱色 | 정보 | `#2F7A8C` | `#5FB8CC` |

**보더-배경 명암 반전**이 핵심 아이덴티티: 라이트는 먹색 보더 위 크림 배경("화지"), 다크는
크림색 보더 위 남색 배경("밤의 대화창"). `--color-sidebar-*`는 테마와 무관하게 항상
藍色(남색) 고정 — 사이드바는 언제나 "밤"이다.

## 모서리 · 프레임

- `--radius-*`: 전부 `0`(배지 `2px`) — 도트 DNA 유지
- `--shadow-ring`(신설): `0 0 0 3px var(--color-bg), 0 0 0 5px var(--color-border)` —
  JRPG 텍스트박스 특유의 이중 프레임. 카드·모달·패널 전반에 적용, 별도 그림자 블러 없음
- `--shadow-sm/md/lg/xl`: 기존 하드 오프셋 유지 — 버튼 클릭 피드백 전용(패널에는 미사용)
- 코너 브라켓 장식은 기획에서 제외(결정 사항 4번 참고)
- 배경 텍스처: `--dot-grid`를 세이가이하(青海波) 풍 `repeating-radial-gradient`로 교체,
  `body` 전체에 적용

## 타이포그래피

| 역할 | 폰트 | 적용처 |
|---|---|---|
| 포인트(도트) | `DotGothic16` | 브랜드 로고("Happiness Admin"), KPI 숫자, 통계 카운트 |
| 헤딩 | `Noto Serif KR` | `.page-title`(⛩ 마커 포함), 상세 페이지 이름(`.mdp-name`) |
| 본문 | Pretendard | 표·리스트·폼 (변경 없음) |

`DotGothic16`은 한글 글리프가 없어 숫자/영문에서만 적용되고 한국어는 자동 폴백된다.

## 컴포넌트 패턴

| 컴포넌트 | 패턴 |
|---|---|
| **StatusDot** | `clip-path: polygon(...)` 다이아몬드 크레스트, `scale`+`opacity` 펄스 |
| **Sidebar active** | 좌측 바 제거 → `::before { content: '▶' }` JRPG 커서 |
| **카드/테이블/모달** | `border: 2px solid` + `box-shadow: var(--shadow-ring)` |
| **KPI 프로그레스바** | `repeating-linear-gradient` 세그먼트(HP 게이지 인상) — 유지 |
| **로그인 화면** | 테마 무관 항상 다크 — 로컬 스코프 CSS 변수(`--lp-*`)로 독립 처리 |
| **SlideOver** | 전체 프레임 대신 좌측 엣지만 이중선(`border-left` + 2겹 box-shadow) |
| **네이티브 radio/range** | `appearance:none` 각진 재스킨(Pixel Arcade부터 유지) |
| **차트(Recharts)** | 팔레트 전체를 전통 색채 8색으로 교체, `radius={0}` |

## 적용 범위

토큰(`tokens.css`)·전역 스타일(`global.css`) 기반이라 대부분 자동 반영. 직접 수정한 파일:

- `styles/tokens.css`, `styles/global.css`, `public/index.html`(폰트 링크), `App.jsx`(Toaster)
- `components/common/{StatusDot,Pagination,ConfirmDialog,SlideOver,CommandPalette}.css`
- `components/layout/{Sidebar,AdminTopbar}.css`
- `components/dashboard/{ActivityFeed,BookingCalendar,WeeklyBookingList}.{css,jsx}`
- `pages/{Dashboard,Login,NotFound,MemberList,MemberDetail,Stats,System,Photo,Report,
  Featured,GalleryOrder,Popup,Inquiry,ContentPolicy,SortPhotos,SortSeries,
  SortSeriesDetail,SortPortfolio}Page.{css,jsx}`

## 알려진 예외

- `PopupPage.css`의 `.popup-preview-*`(happiness-app 모바일 화면 실제 미리보기)는
  대상 앱 자체의 브랜드 색·라운드 모서리를 그대로 유지 — admin 테마 적용 대상 아님
- 코너 브라켓 장식은 기획서에 있었으나 구현 단계에서 제외(사유는 기획서 결정 사항 참고)

## QA 중 발견·수정한 버그

- 8개 페이지 CSS가 존재하지 않는 토큰 `--color-text`/`--color-text-2`를 참조하던 잠재
  버그 발견(상속으로 우연히 정상 렌더링되던 상태) → `--color-text-primary`/
  `--color-text-secondary`로 일괄 수정
- 자동화 QA 스크린샷에서 일부 카드가 비어 보이는 현상 확인 — 실제로는
  `IntersectionObserver` 기반 진입 애니메이션이 헤드리스 브라우저의 짧은 캡처 대기시간보다
  늦게 트리거된 테스트 타이밍 이슈였음(실제 사용자 경험에는 영향 없음, 3초 대기 후 재확인해
  정상 렌더링 확인)

## 관련 문서

- `docs/planning/JAPANESE_DOT_DESIGN_SPEC.md` — 최초 기획 원본
- `docs/design/PIXEL_ARCADE_DESIGN_SPEC.md` — 3차 디자인 기록(레거시)
- `docs/design/COSMOS_DESIGN_SPEC.md`, `PINTEREST_DESIGN_SPEC.md` — 1차 디자인 명세(레거시)

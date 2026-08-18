# Pixel Arcade 디자인 시스템 — 구현 기록

Happiness Admin의 현재(2026-08) 적용 디자인 시스템 전체 기록. Cosmos × Pinterest 퓨전 →
Railway DNA → **Pixel Arcade**(현재)로 이어진 리뉴얼의 최종 상태를 정리한다.

## 컨셉 계보

| 단계 | 컨셉 | 핵심 DNA |
|---|---|---|
| 1차 | Cosmos × Pinterest 퓨전 | Pin Red, 라이트 마소니 + 다크 콜라주 |
| 2차 | Railway DNA | `#0B0D0E` 블랙, `#7C3AED` Violet, 미니멀 다크 |
| **3차 (현재)** | **Pixel Arcade** | 각진 모서리, 네온 마젠타, 하드 픽셀 섀도우 |

## 팔레트

| 토큰 | Light | Dark | 용도 |
|---|---|---|---|
| `--color-brand` | `#E6006B` | `#FF3D81` | 네온 마젠타 — CTA, 액티브 상태 |
| `--color-success` | `#0DB84A` | `#39FF88` | 네온 그린 |
| `--color-warning` | `#B8860B` | `#FFD23F` | 네온 앰버 |
| `--color-danger` | `#D91E36` | `#FF3355` | 네온 레드 |
| `--color-info` | `#0891B2` | `#4CE0FF` | 네온 시안 |
| `--color-bg` | `#F4F1E8` (아케이드 크림) | `#0A0A0F` (아케이드 블랙) | 배경 |
| `--color-surface` | `#FFFFFF` | `#14141C` | 카드 |
| `--color-border` | `#1A1A1A` | `#3D3D52` | 테두리 (하드 엣지 표현용으로 진하게) |
| `--color-sidebar-active-text` | — | `#FF3D81` / 라이트 `#E6006B` | 사이드바 활성 |

## 모서리 · 그림자

- `--radius-*`: 전부 `0` (배지만 `2px`) — 부드러운 곡선을 전면 배제
- `--shadow-*`: 블러 없는 하드 오프셋. `2~6px` 오프셋 + `0` 블러, 색은 `--color-border`
  - `--shadow-sm: 2px 2px 0`, `--shadow-md: 3px 3px 0`, `--shadow-lg: 4px 4px 0`, `--shadow-modal: 8px 8px 0`
- 호버: 섀도우 확대 + `translate(-1px~-2px, -1px~-2px)`
- `:active`: 섀도우 제거 + `translate(2px, 2px)` — 버튼이 "눌리는" 촉각 피드백

## 타이포그래피

- 본문: Pretendard Variable (가독성 우선, 유지)
- 포인트: `Press Start 2P` (Google Fonts) — 브랜드 로고, 페이지 타이틀, KPI 숫자
  - 픽셀 폰트는 가독성이 낮아 `text-lg` 이하로만 사용, 본문에는 절대 사용 안 함

## 컴포넌트 패턴

| 컴포넌트 | 패턴 |
|---|---|
| **StatusDot** | 원형 → 정사각(`border-radius:0`), `image-rendering:pixelated`, 부드러운 pulse → `steps()` 계단식 깜빡임 |
| **KPI 프로그레스바** | 단색 그라데이션 → `repeating-linear-gradient` 세그먼트 블록(게임 체력바 스타일) |
| **버튼** | 2px 보더 + 하드 섀도우 + 클릭 눌림 효과, 대문자 라벨 + 자간 |
| **배지** | 각진(`2px`) + `1.5px solid currentColor` 테두리, 대문자 |
| **네이티브 radio/range** | `appearance:none`으로 재스킨 — 각진 라디오 박스, 각진 슬라이더 섬 |
| **Sidebar 활성 링크** | rgba 글로우 → 각진 블록 하이라이트 + 3px 좌측 바 |
| **아바타/로고닷** | 원형(`50%`) → 정사각(`0`) |
| **배경 텍스처** | `radial-gradient` 반복 도트 그리드 (`--dot-grid`) |
| **모달/토스트** | 하드 섀도우(`--shadow-modal`) + 각진 모서리 + 2px 보더 |
| **PopupPage 폰 목업** | 예외 — happiness-app 모바일 화면 실제 미리보기이므로 라운드 유지 |

## 적용 범위

토큰(`styles/tokens.css`)·전역 스타일(`styles/global.css`) 기반이라 대부분의 화면은 코드 수정 없이
컨셉이 자동 반영된다. 직접 컴포넌트 CSS를 수정한 곳:

- `components/common/StatusDot.css`, `Pagination.css`, `ConfirmDialog.css`
- `components/layout/Sidebar.css`, `AdminTopbar.css`
- `components/dashboard/ActivityFeed.css`, `BookingCalendar.css`
- `pages/DashboardPage.css`(+`.jsx`), `LoginPage.css`, `NotFoundPage.css`
- `pages/GalleryOrderPage.css`, `FeaturedPage.css`, `PhotoListPage.css`, `SeriesListPage.css`
- `pages/Sort{Photos,Series,SeriesDetail,Portfolio}Page.css`, `SystemPage.css`, `MemberDetailPage.css`
- `App.jsx`의 `<Toaster>` 인라인 스타일

## 알려진 예외

- `PopupPage.css`의 `.popup-preview-*`(폰 목업 미리보기)는 의도적으로 라운드 유지
- Recharts 차트 색상(꺾은선/파이/바)은 라이브러리 기본 팔레트를 그대로 사용 — 브랜드 팔레트로
  통일하는 작업은 미착수 (다음 개선 후보)

## QA 중 발견·수정한 버그

- `DashboardPage.css`의 `.kpi-card`/`.kpi-icon`/`.kpi-value`/`.kpi-label`이 `MemberDetailPage.css`의
  동일 클래스명과 전역 충돌 → 대시보드 KPI 카드가 `opacity:0`으로 영구히 숨겨짐.
  `dash-kpi-*` 네임스페이스로 분리해 해결.
- `GET /api/admin/portfolios/{id}` 백엔드 엔드포인트 자체가 미구현 → `/sort/portfolios/:id` 진입 시
  500 에러. 컨트롤러·서비스에 조회 메서드 추가로 해결.

## 관련 문서

- `docs/planning/RAILWAY_DESIGN_SPEC.md` — 2차(Railway DNA) 기획서
- `docs/planning/PIXEL_DOT_DESIGN_SPEC.md` — 3차(Pixel Arcade) 최초 기획서
- `docs/design/COSMOS_DESIGN_SPEC.md`, `PINTEREST_DESIGN_SPEC.md` — 1차 퓨전 디자인 명세(레거시)

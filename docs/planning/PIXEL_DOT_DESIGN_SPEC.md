# Pixel Arcade 디자인 리뉴얼 기획서

기존 Railway DNA(스무스 다크 미니멀)를 레트로 8비트 아케이드 게임 UI 컨셉으로 전환한다.

## 컨셉

콘솔 게임기 화면을 보는 듯한 블록형·각진 UI. 부드러운 그라데이션과 둥근 모서리를 걷어내고
하드 엣지, 오프셋 섀도우, 도트 그리드 텍스처로 대체한다. 클릭 시 버튼이 "눌리는" 촉각 피드백을 준다.

## 팔레트

| 토큰 | Light | Dark(기본) | 용도 |
|---|---|---|---|
| `--color-brand` | `#E6006B` | `#FF3D81` | 네온 마젠타 — 기존 Pin Red 계승 |
| `--color-success` | `#0DB84A` | `#39FF88` | 네온 그린 |
| `--color-info` | `#0891B2` | `#4CE0FF` | 네온 시안 |
| `--color-warning` | `#B8860B` | `#FFD23F` | 네온 앰버 |
| `--color-danger` | `#D91E36` | `#FF3355` | 네온 레드 |
| `--color-bg` | `#F4F1E8` (아케이드 크림) | `#0A0A0F` (아케이드 블랙) | 배경 |
| `--color-surface` | `#FFFFFF` | `#14141C` | 카드 |

## 모서리 · 그림자

- `--radius-*`: 전부 `0` (배지만 `2px`)
- `--shadow-*`: 블러 제거, 하드 오프셋 `2~6px offset + 0 blur`, 색상은 `--color-border`
- 호버: 섀도우 확대 + `translate(-2px,-2px)`
- 클릭(`:active`): 섀도우 제거 + `translate(2px,2px)` — "눌림" 효과

## 타이포그래피

- 본문: Pretendard 유지 (가독성)
- 포인트(브랜드 로고, KPI 숫자, 페이지 타이틀): `Press Start 2P` (Google Fonts) — `--font-pixel`
- 픽셀 폰트는 크기가 크면 가독성이 떨어지므로 KPI 값은 `text-lg` 이하로 제한

## 컴포넌트 패턴

- **StatusDot**: 원형→정사각(`border-radius:0`), `image-rendering:pixelated`, 부드러운 pulse→`steps()` 계단식 깜빡임
- **KPI 프로그레스바**: 단색 그라데이션→반복 블록(체력바) 패턴, `repeating-linear-gradient`로 세그먼트 구분
- **버튼**: 각진 모서리, 2px 보더, 하드 섀도우 + 클릭 눌림 효과, 라벨 대문자+자간
- **Sidebar 활성 링크**: 부드러운 rgba 글로우 → 각진 블록 하이라이트 + 두꺼운 좌측 바
- **카드/배경 텍스처**: 옅은 도트 그리드 (`radial-gradient` 반복 패턴)
- **아바타/로고닷**: 원형(`50%`)→정사각(`0`)

## 적용 범위 (1차)

토큰·전역 스타일 기반 시스템이라 아래만 수정하면 전체 페이지에 자동 반영된다:

1. `styles/tokens.css` — 팔레트·radius·shadow·픽셀 폰트 토큰
2. `styles/global.css` — 버튼/배지/테이블/모달 공통 스타일
3. `components/common/StatusDot.css`
4. `components/layout/Sidebar.css`, `AdminTopbar.css`
5. `pages/DashboardPage.css` (KPI 카드·프로그레스바)

나머지 개별 페이지는 이미 토큰/전역 클래스만 사용하므로 자동으로 컨셉이 적용된다.

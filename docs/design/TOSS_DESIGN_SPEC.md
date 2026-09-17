# Toss 디자인 시스템 — 구현 기록

> **작성**: Claude Code
> **적용일**: 2026-08-29
> **범위**: `frontend/src/styles/tokens.css` 전면 재작성 + AKIRA Neo-Tokyo 시그니처
> 컴포넌트 디테일 제거. 구조(단일 토큰 인터페이스)는 계승하되 각진 모서리·하드 오프셋
> 섀도우·네온 포인트 같은 AKIRA 고유 문법을 전부 걷어내고, 실제 토스(Toss) 브랜드를
> 레퍼런스로 삼아 교체했다 — 톤 전환이 아니라 구조 자체의 전환이다.

## 컨셉 계보

| 세대 | 컨셉 | 상태 |
|---|---|---|
| 1~4차 | Cosmos × Pinterest / Railway DNA / Pixel Arcade / 和ドット | 레거시 |
| 5차 | AKIRA Neo-Tokyo — 사이버펑크 포스터 × HUD 터미널 | 레거시(폐기, 기록 없음 — git 히스토리 참고) |
| **6차 (현재)** | **Toss** — 흰 캔버스 + 파랑 하나, 부드러운 카드와 절제된 신뢰감 | **적용 중** |

AKIRA가 "각진 프레임·이중 액자·네온 포인트"였다면, Toss는 정반대 문법이다 — 장식이
아니라 여백과 하나의 확신 있는 파랑으로 신뢰를 만든다. 색상 재도색이 아니라 **모서리·
그림자·타이포그래피·인터랙션 전부**를 바꿨다.

## 팔레트 (실측 레퍼런스)

```css
/* Brand — Toss Blue (검색으로 확인한 실제 브랜드 컬러) */
--color-brand:  #3182F6  /* 라이트 */  /  #4C8FFF (다크)

/* Secondary accent — 보조 정보용 sky */
--color-accent: #0EA5E9  /* 라이트 */  /  #38BDF8 (다크)

/* Semantic */
--color-success: #12B76A / #32D583(다크)
--color-warning: #F59E0B / #FBBF24(다크)
--color-danger:  #F04452 / #FF6B78(다크)   /* Toss의 실제 "감소/경고" 레드 톤 */
--color-info:    #0EA5E9 / #38BDF8(다크)

/* Neutral — 밝은 회색 캔버스 위 화이트 카드 (하드 블랙 라인 없음) */
--color-bg:      #F2F4F6 (라이트) / #14181D (다크)
--color-surface: #FFFFFF (라이트) / #1B2027 (다크)
--color-border:  #E5E8EB (라이트) / #2C333D (다크)   /* AKIRA의 흑백 반전 대신 항상 옅은 회색 */

/* Text — Toss 실측 grey900 */
--color-text-primary: #191F28 (라이트) / #F2F4F6 (다크)

/* Sidebar — 항상 다크 네이비(내비게이션 대비용, 테마 무관 유지) */
--color-sidebar-bg: #191F28, active: 브랜드 블루 필박스 + 흰 텍스트
```

**AKIRA와의 결정적 차이**: AKIRA는 라이트=화이트 배경/블랙 보더, 다크=블랙 배경/화이트
보더로 **반전**했다. Toss는 반전하지 않는다 — 라이트·다크 모두 "옅은 회색 보더 위에 낮은
채도" 원칙을 유지하고, 파랑 하나만 두 모드에서 밝기만 다르게 튄다.

## 모서리 · 그림자 · 텍스처

- **둥근 모서리로 전환**: `--radius-sm: 8px` ~ `--radius-2xl: 24px`, `--radius-full: 999px`.
  AKIRA의 `radius: 0`(포스터 컷아웃) 전부 폐기.
- **하드 오프셋 섀도우 폐기**: `--shadow-sm/md/lg/xl`을 `2px 2px 0 border` 같은 픽셀
  오프셋에서 `blur` 기반 소프트 엘리베이션으로 교체. 버튼 클릭 피드백도
  `translate(2px,2px)+box-shadow:none`(눌림) 대신 `transform: scale(0.97)`(스퀴시)로
  교체.
- **이중 액자 프레임 폐기**: `--shadow-ring`/`--shadow-modal`은 토큰명은 유지했지만 값은
  `0 0 0 3px bg, 0 0 0 5px border` 이중 링에서 단일 소프트 섀도우로 교체 — 카드가 "액자"가
  아니라 "떠 있는 판"처럼 보이도록.
- **네온 글로우 → 소프트 글로우**: `--shadow-glow-red/-cyan` 토큰명은 유지(하위 호환)했지만
  `1px 링 + 하드 네온 블러` 대신 부드러운 컬러 그림자로 값만 교체.
- **텍스처 전면 제거**: CRT 스캔라인(`--dot-grid`), 경고 해저드 스트라이프
  (`--hazard-stripe`) 토큰과 그 사용처(상단바 최상단 3px 바, 페이지 배경)를 전부 삭제했다.
  Toss는 배경에 어떤 반복 텍스처도 쓰지 않는다.
- **다이아몬드 StatusDot → 원**: `clip-path: polygon(...)` 다이아몬드를 표준 원형
  (`border-radius: var(--radius-full)`)으로 교체(`StatusDot.css`, `AdminTopbar.css`).
- **사이드바 ▶ 커서 → 필박스**: `.sidebar-link.active::before { content: '▶' }` 텍스트
  커서를 제거하고, 활성 항목 전체를 브랜드 블루로 채운 둥근 필(pill) 배경으로 교체
  (`Sidebar.css`).
- **페이지 타이틀 아이콘 제거**: `.page-title::before`의 레드 타겟 리클(◉)을 제거 — Toss는
  헤딩 앞에 장식 아이콘을 붙이지 않는다.

## 타이포그래피

AKIRA는 Orbitron(숫자·로고, 한글 미지원)과 Black Han Sans(타이틀, 포스터체) 두 개의
전용 디스플레이 서체를 썼다. Toss는 **단일 산세리프 체계**다 — 숫자든 타이틀이든 굵기·
크기만으로 위계를 만든다.

| 토큰 | AKIRA | Toss(현재) | 비고 |
|---|---|---|---|
| `--font-pixel` | Orbitron | `var(--font-sans)`(별칭) | 토큰명은 하위 호환 유지, 값만 Pretendard로 통일 |
| `--font-serif` | Black Han Sans | `var(--font-sans)`(별칭) | 동일 |
| `--font-sans` | Pretendard | Pretendard(변경 없음) | Toss 실제 프로덕트도 인접한 톤의 휴머니스트 산세리프 사용 |

`public/index.html`에서 Orbitron·Black Han Sans Google Fonts 링크(및 관련 preconnect)를
제거했다 — 더 이상 로드하지 않는다.

## 컴포넌트 패턴

| 요소 | 처리 |
|---|---|
| 버튼(`.btn` 계열) | `text-transform: uppercase` 전부 제거, 테두리 없는 채움(fill) 기본, hover는 `filter: brightness(0.96)`, active는 `scale(0.97)` 스퀴시 |
| 배지(`.badge`) | 각진 테두리(`1.5px solid currentColor`, `radius:0`)에서 테두리 없는 필박스(`radius: full`)로 |
| 카드/모달/테이블 | `border: 2px` → `1px`, `--shadow-ring`/`--shadow-modal` 값 교체로 자동 반영 |
| 폼 컨트롤(라디오·레인지) | "픽셀 아케이드"(각진 사각 라디오, 각진 슬라이더 손잡이)에서 원형으로 |
| 로그인 화면 | 로컬 스코프 `--lp-*` 변수를 Toss 팔레트로 교체 — AKIRA 때는 "로그인 화면은 항상 다크 고정"이었으나, Toss 전환에서는 앱 전체와 동일하게 밝은 화이트 카드로 전환(다크 고정 원칙 폐기) |
| 사이드바 | 배경은 다크 네이비 유지(내비게이션 대비 목적, 브랜드 반전과 무관), 활성 항목만 AKIRA의 텍스트+화살표 방식에서 Toss의 채움 필박스로 |

## 적용 범위

`tokens.css`(전면 재작성) + `global.css`(버튼·배지·모달·폼 컨트롤·페이지 타이틀) +
`public/index.html`(폰트 링크) + `AdminTopbar.css`(해저드 스트라이프 제거, 다이아몬드→원,
보더 완화) + `Sidebar.css`(▶ 커서→필박스, 그룹 라벨) + `StatusDot.css`(다이아몬드→원) +
`LoginPage.css`(로컬 스코프 전면 재작성) + 다수 페이지 CSS의 하드코딩된 `border-radius: 0`,
`2px solid` 보더, `translate(Npx,Npx)` 클릭 피드백을 토큰 기반 값으로 정리.

카테고리(`--color-cat-*`)·무드(`--color-mood-*`) 배지 색상은 AKIRA 때와 동일하게 이번
재도색 범위에서 **제외**했다 — 콘텐츠 분류용 색이라 브랜드 아이덴티티와 결이 달라도 무방.

## 알려진 예외

- `KpiCard`(대시보드)의 아이콘 색상은 카드별 하드코딩 hex — AKIRA 때부터 있던 기존 패턴,
  이번 작업 범위 밖(토큰화는 별도 과제).
- 일부 소형 라벨(`CommandPalette`, `SlideOver`, `ReportListPage`의 필드 라벨)에 남아있는
  `text-transform: uppercase` + letter-spacing은 한글 텍스트에는 시각적 영향이 없고
  ("uppercase"는 한글에 무효과), 작은 회색 캡션 라벨 패턴 자체는 Toss류 시스템에서도
  흔히 쓰이는 관례라 별도로 제거하지 않았다.

## 관련 문서

- `frontend/src/styles/tokens.css` — 실제 토큰 정의(항상 이 파일이 최종 진실)

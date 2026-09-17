---
name: qa-admin-routes
description: Happiness Admin의 전체 라우트를 agent-browser로 로그인→순회하며 콘솔 에러·네트워크 5xx·페이지 에러를 점검하고 스크린샷을 남기는 QA 스킬. UI/디자인 변경, 백엔드 API 변경, 배포 전 회귀 확인 등 "화면이 실제로 잘 뜨는지 검증해줘" 요청에 사용한다.
---

# qa-admin-routes

기능 구현이나 디자인 변경 후 "실제로 동작하는지" 확인할 때, 매번 임시
Playwright 스크립트를 새로 짜는 대신 이 스킬을 쓴다. `agent-browser` CLI
스킬(별도 설치됨)을 기반으로 `scripts/qa-check.sh` 하나로 전체 라우트를
스윕한다.

## 사전 조건

- 백엔드가 8081, 프론트가 3000에서 떠 있어야 한다(`cd backend && ./gradlew bootRun`,
  `cd frontend && npm start`).
- `agent-browser`가 전역 설치돼 있어야 한다(`npm i -g agent-browser`). 이미
  설치돼 있으면 스킵.
- 이 샌드박스 환경은 agent-browser의 기본 Chrome 다운로드가 프록시에 막혀
  실패한다 — Playwright용으로 이미 받아둔 Chromium을 재사용해야 한다:
  `export AGENT_BROWSER_EXECUTABLE_PATH=/opt/pw-browsers/chromium`
  (스크립트 자체에도 기본값으로 이미 들어 있어 별도 설정 없이도 동작한다.)

## 실행

```bash
./scripts/qa-check.sh
```

라우트별로 `✓`/`✗`를 출력하고, 실패 시 어떤 종류(pageerror/console
error/5xx)인지 함께 보여준다. 스크린샷은 `qa-output/`에 저장된다(git에는
안 올라감 — `.gitignore` 처리됨).

## 알려진 노이즈 (버그 아님, 오탐 주의)

스크립트가 이미 필터링하지만, 수동으로 `agent-browser console`을 볼 때도
아래 두 가지는 이 프로젝트의 알려진 환경 노이즈다:

- `net::ERR_TUNNEL_CONNECTION_FAILED` — 샌드박스가 picsum.photos 등 외부
  이미지 도메인을 막아서 나는 것. 실제 배포 환경에서는 안 남.
- `React Router will begin wrapping...` — React Router v6→v7 프리뷰 경고.
  라이브러리 버전 안내일 뿐 앱 코드 문제 아님.

## 새 라우트를 추가했을 때

`App.jsx`에 라우트를 추가했다면 `scripts/qa-check.sh`의 `ROUTES` 배열에도
같은 경로를 추가한다 — 스크립트가 `App.jsx`를 자동으로 읽지 않으므로 수동
동기화가 필요하다.

## 이 스킬이 하지 않는 것

- 로그인 화면 외의 인증 플로우(비밀번호 재설정 등)는 다루지 않는다.
- 시각적 회귀(픽셀 비교)는 하지 않는다 — 콘솔/네트워크 에러와 스크린샷
  존재 여부만 확인한다. 디자인 디테일 검증은 `design` 스킬의 PREVIEW
  단계에서 스크린샷을 직접 눈으로 봐야 한다.
- 다크모드는 스크립트에 포함돼 있지 않다 — 필요하면
  `agent-browser click '.topbar-theme-btn'`을 로그인 직후에 추가해서 쓴다.

#!/usr/bin/env bash
# Happiness Admin 라우트 QA 스윕 — agent-browser CLI 기반.
#
# 이전에는 매 검증마다 임시 Playwright 스크립트를 새로 작성했다. 이 스크립트는
# 그 워크플로(로그인 -> 라우트 순회 -> 콘솔/네트워크 에러 체크 -> 스크린샷)를
# agent-browser로 고정해, 다음부터는 스크립트를 새로 짜지 않고 이 파일만 실행하면
# 된다.
#
# 사전 조건: 백엔드(8081)와 프론트(3000)가 이미 떠 있어야 한다.
# 사용법:
#   ./scripts/qa-check.sh
#   BASE_URL=http://localhost:3000 ADMIN_EMAIL=... ADMIN_PASSWORD=... ./scripts/qa-check.sh

set -uo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@happiness.dev}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Admin123!}"
OUT_DIR="${QA_OUT_DIR:-./qa-output}"

# 이 환경(샌드박스)에서는 agent-browser가 자체 Chrome을 새로 다운로드할 수 없으므로,
# Playwright용으로 이미 설치된 Chromium을 재사용한다. 다른 환경에서는
# `agent-browser install` 로 받은 기본 브라우저를 그대로 써도 되므로 이 줄은
# 생략 가능하다.
export AGENT_BROWSER_EXECUTABLE_PATH="${AGENT_BROWSER_EXECUTABLE_PATH:-/opt/pw-browsers/chromium}"

# 이 프로젝트에서 알려진, 버그가 아닌 노이즈 — 그대로 보고하면 매번 오탐이 된다.
# (샌드박스의 외부 이미지 도메인 차단, React Router v7 프리뷰 경고)
KNOWN_NOISE_REGEX='ERR_TUNNEL_CONNECTION_FAILED|React Router will begin wrapping'

ROUTES=(
  "/" "/bookings" "/members" "/members/1" "/photos" "/inquiries"
  "/portfolios" "/series" "/sort/photos" "/sort/series" "/stats" "/system"
  "/notices" "/banners" "/reports" "/verifications" "/featured"
  "/content-policy" "/popups"
)

mkdir -p "$OUT_DIR"
FAIL=0

echo "== 로그인 =="
agent-browser close --all >/dev/null 2>&1
agent-browser open "$BASE_URL/login" >/dev/null
agent-browser fill 'input[type="email"]' "$ADMIN_EMAIL" >/dev/null
agent-browser fill 'input[type="password"]' "$ADMIN_PASSWORD" >/dev/null
agent-browser click 'button[type="submit"]' >/dev/null
agent-browser wait --url "$BASE_URL/" >/dev/null || {
  echo "✗ 로그인 실패 — 이후 라우트 체크를 건너뜁니다"
  agent-browser close --all >/dev/null 2>&1
  exit 1
}
echo "✓ 로그인 성공"

for route in "${ROUTES[@]}"; do
  agent-browser network requests --clear >/dev/null 2>&1
  agent-browser console --clear >/dev/null 2>&1
  agent-browser errors --clear >/dev/null 2>&1

  agent-browser open "${BASE_URL}${route}" >/dev/null
  agent-browser wait --load networkidle >/dev/null 2>&1

  page_errors="$(agent-browser errors 2>/dev/null)"
  console_out="$(agent-browser console 2>/dev/null | grep -Ev "$KNOWN_NOISE_REGEX")"
  net_5xx="$(agent-browser network requests --filter '5' 2>/dev/null | grep -E ' 5[0-9]{2} ')"

  fname="qa$(echo "$route" | tr '/' '_')"
  [ "$fname" = "qa" ] && fname="qa_root"
  agent-browser screenshot "${OUT_DIR}/${fname}.png" >/dev/null 2>&1

  issue=""
  [ -n "$page_errors" ] && issue="${issue}  pageerror: ${page_errors}\n"
  echo "$console_out" | grep -qi "error" && issue="${issue}  console error 감지\n"
  [ -n "$net_5xx" ] && issue="${issue}  5xx: ${net_5xx}\n"

  if [ -n "$issue" ]; then
    echo "✗ ${route}"
    printf "%b" "$issue"
    FAIL=1
  else
    echo "✓ ${route}"
  fi
done

agent-browser close --all >/dev/null 2>&1

echo ""
if [ "$FAIL" -eq 0 ]; then
  echo "== 전체 통과 =="
else
  echo "== 문제 발견 — 위 ✗ 항목 확인 =="
fi
exit "$FAIL"

#!/usr/bin/env bash
# 노션 "어드민 화면 현황" 문서화를 위한 전체 페이지 스크린샷 캡처.
set -uo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@happiness.dev}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Admin123!}"
OUT_DIR="${OUT_DIR:-./notion-screens}"
export AGENT_BROWSER_EXECUTABLE_PATH="${AGENT_BROWSER_EXECUTABLE_PATH:-/opt/pw-browsers/chromium}"

mkdir -p "$OUT_DIR"

agent-browser close --all >/dev/null 2>&1
agent-browser open "$BASE_URL/login" >/dev/null
agent-browser wait --load networkidle >/dev/null
agent-browser fill 'input[type="email"]' "$ADMIN_EMAIL" >/dev/null
agent-browser fill 'input[type="password"]' "$ADMIN_PASSWORD" >/dev/null
agent-browser click 'button[type="submit"]' >/dev/null
agent-browser wait --url "$BASE_URL/" >/dev/null

# route:filename
ROUTES=(
  "/:dashboard"
  "/photos:photos"
  "/portfolios:portfolios"
  "/series:series"
  "/sort/photos:sort_photos"
  "/sort/series:sort_series"
  "/sort/series/1:sort_series_detail"
  "/sort/portfolios/1:sort_portfolios_detail"
  "/reports:reports"
  "/featured:featured"
  "/content-policy:content_policy"
  "/members:members"
  "/members/1:member_detail"
  "/verifications:verifications"
  "/inquiries:inquiries"
  "/bookings:bookings"
  "/stats:stats"
  "/notices:notices"
  "/banners:banners"
  "/popups:popups"
  "/system:system"
)

for entry in "${ROUTES[@]}"; do
  route="${entry%%:*}"
  name="${entry##*:}"
  agent-browser open "${BASE_URL}${route}" >/dev/null
  agent-browser wait --load networkidle >/dev/null 2>&1
  agent-browser wait 500 >/dev/null
  agent-browser screenshot "${OUT_DIR}/${name}.png" >/dev/null
  echo "captured: ${route} -> ${OUT_DIR}/${name}.png"
done

# 로그인 화면은 별도로 로그아웃 상태에서 캡처
agent-browser eval "localStorage.clear()" >/dev/null
agent-browser open "${BASE_URL}/login" >/dev/null
agent-browser wait --load networkidle >/dev/null 2>&1
agent-browser screenshot "${OUT_DIR}/login.png" >/dev/null
echo "captured: /login -> ${OUT_DIR}/login.png"

agent-browser close --all >/dev/null 2>&1
echo "done"

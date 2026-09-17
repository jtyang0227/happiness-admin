#!/bin/bash
# Stop 이벤트마다 실행 — frontend/src/pages 아래 화면 파일이 바뀌었으면
# Claude를 멈추지 않고 "스크린샷 찍고 Gmail로 보내라"는 지시를 다시 넣는다.
#
# 커밋 여부와 무관하게 "지금 워킹트리에 반영된 변경 내용"을 기준으로 판단한다 —
# 대부분의 작업은 커밋 전 상태로 여러 턴에 걸쳐 진행되므로, 커밋 해시 대신
# 현재 diff의 해시를 마커로 써야 "같은 미완료 변경에 대해 매 턴 반복 알림"을
# 막을 수 있다.
set -uo pipefail

cd "$CLAUDE_PROJECT_DIR" || exit 0

PAGE_PATH="frontend/src/pages"
MARKER_FILE="$CLAUDE_PROJECT_DIR/.claude/.page-change-notify-marker"
RECIPIENT="jtyang0227@gmail.com"

# git 저장소가 아니거나 git이 없으면 조용히 통과 (이 훅은 이 프로젝트 전제)
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0

changed_files=$(git status --porcelain -- "$PAGE_PATH" 2>/dev/null \
  | awk '{print $2}' | grep -E '\.(jsx|css)$' || true)

# 변경된 화면 파일이 하나도 없으면 알림 없이 정상 종료 허용
if [ -z "$changed_files" ]; then
  exit 0
fi

current_sig=$( { git diff -- "$PAGE_PATH"; git status --porcelain -- "$PAGE_PATH"; } 2>/dev/null | sha256sum | awk '{print $1}')

last_sig=""
[ -f "$MARKER_FILE" ] && last_sig=$(cat "$MARKER_FILE")

# 이미 같은 변경 상태로 한 번 알렸다면 다시 막지 않는다 (반복 알림 방지)
if [ "$current_sig" = "$last_sig" ]; then
  exit 0
fi

echo "$current_sig" > "$MARKER_FILE"

file_list=$(echo "$changed_files" | sed 's/^/- /')

reason=$(printf '화면 파일이 변경됐습니다:\n%s\n\n멈추기 전에 반드시:\n1) agent-browser로 위 페이지들만 스크린샷을 찍으세요.\n2) 이 채팅에 Gmail이 켜져 있으면 Gmail MCP 도구로 %s 에게 변경 요약과 페이지별 스크린샷을 첨부한 이메일 1통을 보내세요.\n3) Gmail이 꺼져 있으면 보내지 말고, 켜달라고 사용자에게 알려주세요.\n' "$file_list" "$RECIPIENT")

jq -n --arg reason "$reason" '{decision: "block", reason: $reason}'

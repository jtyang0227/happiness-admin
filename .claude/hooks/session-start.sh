#!/bin/bash
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

echo "[session-start] 프론트엔드 의존성 설치 중..."
cd frontend && npm install && cd ..

echo "[session-start] 백엔드 의존성 다운로드 중..."
cd backend && ./gradlew dependencies --quiet && cd ..

echo "[session-start] 완료"

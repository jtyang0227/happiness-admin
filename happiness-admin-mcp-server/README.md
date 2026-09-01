# happiness-admin-mcp-server

Happiness Admin의 read-only 데이터와 신고 AI 트리아지 실행을 MCP(Model Context
Protocol) 도구로 노출하는 로컬 stdio MCP 서버입니다. 별도 채널로 admin API를
호출하는 기존 REST 백엔드(`backend/`) 위에 얇게 얹힌 어댑터이며, 백엔드 로직을
새로 만들지 않습니다.

## 제공 도구

| 도구 | 설명 | 조회 전용 |
|---|---|---|
| `happiness_admin_get_dashboard_summary` | 대시보드 요약 통계 조회 | ✅ |
| `happiness_admin_list_reports` | 신고 목록 조회 (상태·대상유형 필터, AI 트리아지 결과 포함) | ✅ |
| `happiness_admin_list_members` | 회원 목록 조회 (검색·권한·상태 필터) | ✅ |
| `happiness_admin_run_report_ai_triage` | 미분석 신고에 대해 AI 요약·심각도·참고용 조치 산출 실행 | ❌ (조회는 아니지만 실제 상태 전환은 하지 않음) |

**이 서버는 조치성 API(회원 정지, 콘텐츠 삭제, 신고 처리 등)를 의도적으로 노출하지
않습니다.** 그런 조치는 반드시 Happiness Admin UI에서 사람 관리자가 직접 실행해야
합니다 — MCP 도구를 통한 자동화된 실제 조치는 오탐 시 책임 소재 문제가 생기므로
범위에서 제외했습니다.

## 설치 및 빌드

```bash
cd happiness-admin-mcp-server
npm install
npm run build
```

## 환경변수

| 변수 | 필수 | 설명 |
|---|---|---|
| `HAPPINESS_ADMIN_API_URL` | 아니오 (기본 `http://localhost:8081/api`) | Happiness Admin 백엔드 API 베이스 URL |
| `HAPPINESS_ADMIN_EMAIL` | 예 | 관리자 로그인 이메일 (ROLE_WM 또는 ROLE_SA 계정) |
| `HAPPINESS_ADMIN_PASSWORD` | 예 | 관리자 로그인 비밀번호 |

## Claude Code에 연결하기

`.mcp.json`(프로젝트 루트) 또는 `claude mcp add` 명령으로 등록합니다:

```json
{
  "mcpServers": {
    "happiness-admin": {
      "command": "node",
      "args": ["./happiness-admin-mcp-server/dist/index.js"],
      "env": {
        "HAPPINESS_ADMIN_EMAIL": "admin@happiness.dev",
        "HAPPINESS_ADMIN_PASSWORD": "Admin123!"
      }
    }
  }
}
```

백엔드(`cd backend && ./gradlew bootRun`)가 먼저 떠 있어야 도구 호출이 성공합니다.

## 로컬 동작 확인

MCP Inspector로 도구 목록과 호출을 직접 확인할 수 있습니다:

```bash
HAPPINESS_ADMIN_EMAIL=admin@happiness.dev HAPPINESS_ADMIN_PASSWORD=Admin123! \
  npx @modelcontextprotocol/inspector node dist/index.js
```

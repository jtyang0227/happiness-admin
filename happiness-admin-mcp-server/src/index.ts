#!/usr/bin/env node
/**
 * MCP server for Happiness Admin.
 *
 * Happiness Admin(사진 커뮤니티 관리자 대시보드)의 read-only 데이터(대시보드 통계,
 * 신고 목록, 회원 목록)와 신고 AI 트리아지 실행을 LLM 에이전트가 도구로 쓸 수 있게
 * 노출한다. 실제 회원 정지·콘텐츠 삭제 등 조치성 API는 의도적으로 노출하지 않는다 -
 * 이 서버는 "조회 + AI 요약 트리거"까지만 담당한다.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerStatsTools } from "./tools/stats.js";
import { registerReportTools } from "./tools/reports.js";
import { registerMemberTools } from "./tools/members.js";
import { registerAiTriageTools } from "./tools/aiTriage.js";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "./constants.js";

const server = new McpServer({
  name: "happiness-admin-mcp-server",
  version: "1.0.0",
});

registerStatsTools(server);
registerReportTools(server);
registerMemberTools(server);
registerAiTriageTools(server);

async function main(): Promise<void> {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error(
      "ERROR: HAPPINESS_ADMIN_EMAIL / HAPPINESS_ADMIN_PASSWORD 환경변수가 필요합니다."
    );
    process.exit(1);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("happiness-admin-mcp-server running via stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { makeApiRequest, handleApiError } from "../services/apiClient.js";
import { RunAiTriageInputSchema, RunAiTriageInput } from "../schemas/reports.js";
import { AiTriageRunResult } from "../types.js";

export function registerAiTriageTools(server: McpServer): void {
  server.registerTool(
    "happiness_admin_run_report_ai_triage",
    {
      title: "신고 AI 트리아지 실행",
      description: `아직 AI로 분석되지 않은 대기중(PENDING/IN_REVIEW) 신고를 최대 limit건 골라 Claude로 요약·심각도·참고용 조치를 산출하고 저장한다.

**경계선 (중요)**: 이 도구는 신고 요약과 참고용 제안만 만든다. 신고 상태를 DISMISSED/ACTION_TAKEN으로 바꾸거나 콘텐츠를 삭제/회원을 정지하는 등의 실제 조치는 절대 하지 않는다 — 그런 조치는 이 MCP 서버가 아예 제공하지 않으며, Happiness Admin UI에서 사람 관리자가 직접 클릭해야만 일어난다.

이미 분석된 신고(aiAnalyzedAt이 채워진 신고)는 다시 분석하지 않는다 — 여러 번 호출해도 중복 비용이 발생하지 않는다. 호출 비용은 미분석 신고 건수에 비례한다(건당 Claude Opus 5 API 호출 1회, 대략 $0.005~0.01).

Args:
  - limit (number, default 20, max 50): 이번 실행에서 분석할 최대 신고 건수

Returns:
{
  "requested": number,   // 이번 실행 대상으로 뽑힌 신고 수
  "succeeded": number,   // AI 분석에 성공해 저장된 건수
  "failed": number       // 실패한 건수 (다음 실행에 다시 대상이 됨 - 데이터 손실 없음)
}

Examples:
  - Use when: "미분석 신고들 AI로 요약해줘" -> limit 기본값으로 실행
  - Use when: "신고가 너무 많이 쌓였어, 일단 10건만 먼저 봐줘" -> limit=10
  - Don't use when: 특정 신고 하나에 조치를 취해야 할 때 (이 도구는 요약만 하며, 조치는 Admin UI 전용)

Error Handling:
  - ANTHROPIC_API_KEY가 백엔드에 설정되지 않은 경우 requested건 전부 failed로 반환됨(서버는 죽지 않음) - 백엔드 환경변수 확인 필요
  - 인증 실패 시 "Error: 인증에 실패했습니다" 반환`,
      inputSchema: RunAiTriageInputSchema.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async (params: RunAiTriageInput) => {
      try {
        const data = await makeApiRequest<AiTriageRunResult>(
          "/admin/reports/ai-triage/run",
          "POST",
          { limit: params.limit }
        );
        return {
          content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
          structuredContent: data as unknown as Record<string, unknown>,
        };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );
}

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { makeApiRequest, handleApiError } from "../services/apiClient.js";
import { truncateToLimit } from "../services/format.js";
import { ListReportsInputSchema, ListReportsInput } from "../schemas/reports.js";
import { AdminReport, PageResponse } from "../types.js";

export function registerReportTools(server: McpServer): void {
  server.registerTool(
    "happiness_admin_list_reports",
    {
      title: "신고 목록 조회",
      description: `Happiness Admin에 접수된 신고(콘텐츠·회원 신고) 목록을 상태·대상유형으로 필터링해 조회한다. 접수일 내림차순으로 정렬된다.

이 도구는 조회만 하며 신고 상태를 변경하거나 조치를 취하지 않는다. 신고에는 AI 트리아지 결과(aiSummary/aiSeverity/aiSuggestedAction)가 이미 분석돼 있으면 함께 포함된다 — 아직 분석 안 된 신고는 이 필드들이 null이다.

Args:
  - status ('PENDING'|'IN_REVIEW'|'ACTION_TAKEN'|'DISMISSED', optional): 상태 필터
  - target_type ('PHOTO'|'MEMBER'|'SERIES', optional): 신고 대상 유형 필터
  - limit (number, default 20, max 100): 페이지 크기
  - offset_page (number, default 0): 페이지 번호(0부터)

Returns:
{
  "total": number,           // 조건에 맞는 전체 신고 수
  "count": number,           // 이번 응답에 포함된 건수
  "page": number,            // 현재 페이지 번호
  "has_more": boolean,       // 다음 페이지 존재 여부
  "reports": [
    {
      "id": number,
      "reporterName": string | null,   // 탈퇴 회원이면 null
      "targetType": "PHOTO" | "MEMBER" | "SERIES",
      "targetId": number,
      "reason": string,                // 신고 사유 (예: "스팸", "저작권 침해")
      "details": string | null,
      "status": string,
      "createdAt": string,             // ISO-8601
      "aiSummary": string | null,      // AI 트리아지 요약 (미분석 시 null)
      "aiSeverity": "LOW" | "MEDIUM" | "HIGH" | null,
      "aiSuggestedAction": string | null
    }
  ]
}

Examples:
  - Use when: "지금 대기중인 신고 몇 건이야?" -> status="PENDING"으로 조회 후 total 확인
  - Use when: "AI가 HIGH로 분류한 신고 있어?" -> 전체 조회 후 aiSeverity=="HIGH"인 항목 필터링
  - Don't use when: 신고를 처리/분석해야 할 때 (읽기 전용 도구이므로 happiness_admin_run_report_ai_triage를 대신 사용, 실제 상태 전환은 Admin UI에서만 가능 - 이 서버는 조치 도구를 제공하지 않는다)

Error Handling:
  - 인증 실패 시 "Error: 인증에 실패했습니다" 반환`,
      inputSchema: ListReportsInputSchema.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (params: ListReportsInput) => {
      try {
        const data = await makeApiRequest<PageResponse<AdminReport>>("/admin/reports", "GET", {
          status: params.status,
          targetType: params.target_type,
          page: params.offset_page,
          size: params.limit,
        });

        const output = {
          total: data.totalElements,
          count: data.content.length,
          page: data.page,
          has_more: !data.last,
          reports: data.content,
        };

        const { text, output: finalOutput } = truncateToLimit(output, "reports");
        return {
          content: [{ type: "text", text }],
          structuredContent: finalOutput as unknown as Record<string, unknown>,
        };
      } catch (error) {
        return { content: [{ type: "text", text: handleApiError(error) }] };
      }
    }
  );
}

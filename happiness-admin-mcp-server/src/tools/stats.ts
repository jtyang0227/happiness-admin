import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { makeApiRequest, handleApiError } from "../services/apiClient.js";
import { StatsSummary } from "../types.js";

const EmptyInputSchema = z.object({}).strict();

export function registerStatsTools(server: McpServer): void {
  server.registerTool(
    "happiness_admin_get_dashboard_summary",
    {
      title: "대시보드 요약 통계 조회",
      description: `Happiness Admin 대시보드의 실시간 요약 통계를 조회한다(회원 수, 사진 수, 오늘 문의/예약, 미읽음 문의, 대기중 예약·포트폴리오).

이 도구는 조회만 하며 어떤 데이터도 변경하지 않는다.

Returns:
{
  "totalMembers": number,      // 전체 회원 수
  "totalPhotos": number,       // 전체 사진 수
  "todayInquiries": number,    // 오늘 접수된 문의 수
  "unreadInquiries": number,   // 읽지 않은 문의 수
  "todayBookings": number,     // 오늘 예약 수
  "pendingBookings": number,   // 대기중 예약 수
  "pendingPortfolios": number  // 심사 대기중 포트폴리오 수
}

Examples:
  - Use when: "지금 미읽음 문의가 몇 건이야?" -> unreadInquiries 필드 확인
  - Use when: "오늘 전반적인 운영 현황 요약해줘" -> 전체 필드 종합

Error Handling:
  - HAPPINESS_ADMIN_EMAIL/PASSWORD 미설정 또는 로그인 실패 시 "Error: 인증에 실패했습니다" 반환
  - 백엔드 서버 미기동 시 연결 실패 메시지 반환`,
      inputSchema: EmptyInputSchema.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      try {
        const data = await makeApiRequest<StatsSummary>("/admin/stats/summary");
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

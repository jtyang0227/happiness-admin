import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { makeApiRequest, handleApiError } from "../services/apiClient.js";
import { truncateToLimit } from "../services/format.js";
import { ListMembersInputSchema, ListMembersInput } from "../schemas/members.js";
import { AdminMember, PageResponse } from "../types.js";

export function registerMemberTools(server: McpServer): void {
  server.registerTool(
    "happiness_admin_list_members",
    {
      title: "회원 목록 조회",
      description: `Happiness Admin에 등록된 회원 목록을 이름/이메일 검색, 권한, 상태로 필터링해 조회한다.

이 도구는 조회만 하며 회원 정보를 변경하거나 정지/삭제 등의 조치를 취하지 않는다.

Args:
  - search (string, optional): 이름/이메일 부분 검색어
  - authority ('WM'|'SA'|'US', optional): 권한 필터 (WM/SA=관리자, US=일반 회원)
  - status (string, optional): 상태 필터 (예: "ACTIVE", "SUSPENDED")
  - limit (number, default 20, max 100): 페이지 크기
  - offset_page (number, default 0): 페이지 번호(0부터)

Returns:
{
  "total": number,
  "count": number,
  "page": number,
  "has_more": boolean,
  "members": [
    {
      "id": number,
      "name": string,
      "email": string,
      "authority": "WM" | "SA" | "US",
      "status": string,               // 예: "ACTIVE", "SUSPENDED"
      "suspendReason": string | null,
      "suspendUntil": string | null,  // ISO-8601, null이면 정지 아님 또는 영구정지
      "verified": boolean,            // 작가 인증 여부
      "photoCount": number,
      "portfolioCount": number,
      "createdAt": string
    }
  ]
}

Examples:
  - Use when: "지금 정지된 회원이 몇 명이야?" -> status="SUSPENDED"로 조회
  - Use when: "user7@test.com 회원 정보 찾아줘" -> search="user7@test.com"
  - Don't use when: 회원을 정지하거나 역할을 바꿔야 할 때 (이 서버는 조회 전용, 조치는 Admin UI 전용)

Error Handling:
  - 인증 실패 시 "Error: 인증에 실패했습니다" 반환`,
      inputSchema: ListMembersInputSchema.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (params: ListMembersInput) => {
      try {
        const data = await makeApiRequest<PageResponse<AdminMember>>("/admin/members", "GET", {
          search: params.search,
          authority: params.authority,
          status: params.status,
          page: params.offset_page,
          size: params.limit,
        });

        const output = {
          total: data.totalElements,
          count: data.content.length,
          page: data.page,
          has_more: !data.last,
          members: data.content,
        };

        const { text, output: finalOutput } = truncateToLimit(output, "members");
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

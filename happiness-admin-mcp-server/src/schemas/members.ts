import { z } from "zod";

export const ListMembersInputSchema = z
  .object({
    search: z
      .string()
      .max(200)
      .optional()
      .describe("이름/이메일 등 검색어 (부분 일치, 미지정 시 전체)"),
    authority: z
      .enum(["WM", "SA", "US"])
      .optional()
      .describe("권한으로 필터링 (WM/SA=관리자, US=일반 회원)"),
    status: z
      .string()
      .max(20)
      .optional()
      .describe("상태로 필터링 (예: ACTIVE, SUSPENDED)"),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20)
      .describe("한 번에 가져올 최대 건수 (기본 20, 최대 100)"),
    offset_page: z
      .number()
      .int()
      .min(0)
      .default(0)
      .describe("페이지 번호 (0부터 시작)"),
  })
  .strict();

export type ListMembersInput = z.infer<typeof ListMembersInputSchema>;

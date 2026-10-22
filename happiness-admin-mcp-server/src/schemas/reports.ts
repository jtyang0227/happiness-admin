import { z } from "zod";

export const ListReportsInputSchema = z
  .object({
    status: z
      .enum(["PENDING", "IN_REVIEW", "ACTION_TAKEN", "DISMISSED"])
      .optional()
      .describe("상태로 필터링 (미지정 시 전체)"),
    target_type: z
      .enum(["PHOTO", "MEMBER", "SERIES"])
      .optional()
      .describe("신고 대상 유형으로 필터링 (미지정 시 전체)"),
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
      .describe("페이지 번호 (0부터 시작, createdAt 내림차순 정렬)"),
  })
  .strict();

export type ListReportsInput = z.infer<typeof ListReportsInputSchema>;

export const RunAiTriageInputSchema = z
  .object({
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .default(20)
      .describe("이번 실행에서 분석할 최대 신고 건수 (기본 20, 최대 50)"),
  })
  .strict();

export type RunAiTriageInput = z.infer<typeof RunAiTriageInputSchema>;

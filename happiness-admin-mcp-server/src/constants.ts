export const API_BASE_URL =
  process.env.HAPPINESS_ADMIN_API_URL || "http://localhost:8081/api";

export const ADMIN_EMAIL = process.env.HAPPINESS_ADMIN_EMAIL;
export const ADMIN_PASSWORD = process.env.HAPPINESS_ADMIN_PASSWORD;

// 응답이 너무 길어 에이전트 컨텍스트를 낭비하지 않도록 자르는 상한.
export const CHARACTER_LIMIT = 25000;

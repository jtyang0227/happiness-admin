import axios, { AxiosError } from "axios";
import { ADMIN_EMAIL, ADMIN_PASSWORD, API_BASE_URL } from "../constants.js";

interface LoginResponse {
  token: string;
}

let cachedToken: string | null = null;

/**
 * ADMIN_EMAIL/ADMIN_PASSWORD로 로그인해 JWT를 받아온다. 토큰은 프로세스
 * 메모리에만 캐싱하고(디스크 기록 없음), 401을 받으면 makeApiRequest가
 * 캐시를 비우고 한 번 재로그인한다.
 */
async function login(): Promise<string> {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error(
      "HAPPINESS_ADMIN_EMAIL / HAPPINESS_ADMIN_PASSWORD 환경변수가 설정되지 않았습니다."
    );
  }
  const response = await axios.post<LoginResponse>(
    `${API_BASE_URL}/auth/login`,
    { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    { timeout: 10000 }
  );
  cachedToken = response.data.token;
  return cachedToken;
}

async function getToken(): Promise<string> {
  if (cachedToken) return cachedToken;
  return login();
}

export async function makeApiRequest<T>(
  endpoint: string,
  method: "GET" | "POST" = "GET",
  params?: Record<string, unknown>
): Promise<T> {
  const token = await getToken();
  try {
    const response = await axios({
      method,
      url: `${API_BASE_URL}${endpoint}`,
      params,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data as T;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // 토큰 만료 - 한 번만 재로그인 후 재시도
      cachedToken = null;
      const freshToken = await getToken();
      const retryResponse = await axios({
        method,
        url: `${API_BASE_URL}${endpoint}`,
        params,
        timeout: 30000,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${freshToken}`,
        },
      });
      return retryResponse.data as T;
    }
    throw error;
  }
}

export function handleApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string }>;
    if (axiosError.response) {
      const serverMessage = axiosError.response.data?.message;
      switch (axiosError.response.status) {
        case 401:
          return "Error: 인증에 실패했습니다. HAPPINESS_ADMIN_EMAIL/PASSWORD를 확인하세요.";
        case 403:
          return "Error: 권한이 없습니다. WM 또는 SA 권한 계정이 필요합니다.";
        case 404:
          return "Error: 대상을 찾을 수 없습니다. ID를 확인하세요.";
        case 429:
          return "Error: 요청이 너무 많습니다. 잠시 후 다시 시도하세요.";
        default:
          return `Error: API 요청 실패 (HTTP ${axiosError.response.status})${serverMessage ? ` - ${serverMessage}` : ""}`;
      }
    } else if (axiosError.code === "ECONNABORTED") {
      return "Error: 요청 시간이 초과되었습니다. 백엔드 서버가 켜져 있는지 확인하세요.";
    } else if (axiosError.code === "ECONNREFUSED") {
      return `Error: ${API_BASE_URL}에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인하세요.`;
    }
  }
  return `Error: 예상치 못한 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`;
}

import { CHARACTER_LIMIT } from "../constants.js";

/**
 * JSON 직렬화 후 CHARACTER_LIMIT을 넘으면 content 배열(관례상 `items`)을 절반으로
 * 잘라 재직렬화한다. 에이전트 컨텍스트를 무한정 소모하지 않기 위한 안전장치.
 */
type Truncatable = { truncated?: boolean; truncation_message?: string };

export function truncateToLimit<T extends Record<string, unknown>>(
  payload: T,
  itemsKey: keyof T
): { text: string; output: T & Truncatable } {
  let output: T & Truncatable = payload;
  let text = JSON.stringify(output, null, 2);

  const items = payload[itemsKey];
  if (text.length > CHARACTER_LIMIT && Array.isArray(items) && items.length > 1) {
    const halved = items.slice(0, Math.max(1, Math.floor(items.length / 2)));
    output = {
      ...payload,
      [itemsKey]: halved,
      truncated: true,
      truncation_message: `응답이 너무 커서 ${items.length}건 중 ${halved.length}건만 반환했습니다. limit/offset을 조정해 더 좁혀서 다시 조회하세요.`,
    };
    text = JSON.stringify(output, null, 2);
  }

  return { text, output };
}

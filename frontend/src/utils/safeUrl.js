// 사용자(App 작가)가 입력한 URL을 그대로 href에 넣으면 `javascript:` 링크로 관리자 브라우저에서
// 스크립트가 실행될 수 있다(토큰 탈취). http(s)만 링크로 허용하고 나머지는 null을 돌려준다.
export const safeHref = (url) => {
  if (!url || typeof url !== 'string') return null;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : null;
  } catch {
    return null;
  }
};

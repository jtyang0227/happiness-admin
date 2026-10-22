package com.happiness.admin.util;

import java.net.URI;
import java.util.Locale;

/**
 * 관리자가 입력해 App에 링크/이미지로 노출되는 URL 검증 — `javascript:`·`data:` 같은 스킴으로
 * 앱 사용자 브라우저에서 스크립트가 실행되는 것(저장형 XSS)을 막는다.
 */
public final class UrlSafety {

    private UrlSafety() {}

    /** 링크: 앱 내부 상대 경로("/events/summer") 또는 http(s) 절대 URL만 허용. 빈 값은 허용(링크 없음). */
    public static String requireSafeLink(String url, String field) {
        if (url == null || url.isBlank()) return url;
        String v = url.trim();
        if (v.startsWith("/") && !v.startsWith("//")) return v;
        return requireHttp(v, field);
    }

    /** 이미지: http(s) 절대 URL만 허용. */
    public static String requireSafeImage(String url, String field) {
        if (url == null || url.isBlank()) return url;
        return requireHttp(url.trim(), field);
    }

    private static String requireHttp(String v, String field) {
        try {
            URI uri = new URI(v);
            String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
            if ((scheme.equals("http") || scheme.equals("https")) && uri.getHost() != null) return v;
        } catch (Exception ignored) {
            // 아래에서 공통 메시지로 거부
        }
        throw new IllegalArgumentException(field + "은(는) http(s):// 주소" + ("링크".equals(field) ? " 또는 /로 시작하는 앱 내부 경로" : "") + "여야 합니다.");
    }
}

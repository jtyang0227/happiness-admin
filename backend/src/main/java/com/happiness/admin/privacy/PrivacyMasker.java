package com.happiness.admin.privacy;

/**
 * 관리자 화면 기본 노출용 마스킹 — 업무 식별에 필요한 최소한만 남긴다(개인정보 최소 노출).
 * 원문이 필요하면 회원 상세의 "개인정보 보기"(사유 입력 + 접속기록)로만 열람한다.
 */
public final class PrivacyMasker {

    private PrivacyMasker() {}

    /** user2@test.com → us***@test.com, a@x.com → a***@x.com */
    public static String email(String email) {
        if (email == null || email.isBlank()) return email;
        int at = email.indexOf('@');
        if (at <= 0) return "***";
        String local = email.substring(0, at);
        return local.substring(0, Math.min(2, local.length())) + "***" + email.substring(at);
    }

    /** 010-1234-0002 → 010-****-0002, 01012340002 → 010****0002 */
    public static String tel(String tel) {
        if (tel == null || tel.isBlank()) return tel;
        String digits = tel.replaceAll("\\D", "");
        if (digits.length() < 7) return "****";
        if (tel.contains("-")) {
            String[] parts = tel.split("-");
            if (parts.length == 3) return parts[0] + "-****-" + parts[2];
        }
        return digits.substring(0, 3) + "****" + digits.substring(digits.length() - 4);
    }
}

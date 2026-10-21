package com.happiness.admin.privacy;

import com.happiness.admin.entity.Member;
import com.happiness.admin.entity.PrivacyAccessLog;
import com.happiness.admin.repository.PrivacyAccessLogRepository;
import com.happiness.admin.security.CurrentAdminProvider;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** 개인정보 접속기록 기록·무결성 검증. 해시 체인 순서를 지키기 위해 기록은 직렬화한다(단일 인스턴스 기준). */
@Component
@RequiredArgsConstructor
public class PrivacyAccessRecorder {

    public static final int REASON_MIN = 5;

    private final PrivacyAccessLogRepository repository;
    private final CurrentAdminProvider currentAdmin;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public synchronized void record(String action, Long subjectMemberId, Integer subjectCount, String reason, String detail) {
        Member admin = currentAdmin.get().orElse(null);
        String prev = repository.findTopByOrderByIdDesc().map(PrivacyAccessLog::getHash).orElse(null);
        LocalDateTime at = LocalDateTime.now().truncatedTo(ChronoUnit.MICROS);
        Long adminId = admin != null ? admin.getId() : null;
        String adminName = admin != null ? admin.getName() : null;
        String ip = clientIp();
        String safeReason = truncate(reason, 300);
        String safeDetail = truncate(detail, 500);
        repository.save(PrivacyAccessLog.builder()
                .adminId(adminId).adminName(adminName).ipAddress(ip)
                .action(action).subjectMemberId(subjectMemberId).subjectCount(subjectCount)
                .reason(safeReason).detail(safeDetail).accessedAt(at)
                .prevHash(prev)
                .hash(hash(prev, adminId, adminName, ip, action, subjectMemberId, subjectCount, safeReason, safeDetail, at))
                .build());
    }

    /** 사유가 필요한 업무(열람·다운로드)의 입력 검증 */
    public static String requireReason(String reason) {
        if (reason == null || reason.trim().length() < REASON_MIN) {
            throw new IllegalArgumentException("처리 사유를 " + REASON_MIN + "자 이상 입력해 주세요.");
        }
        return reason.trim();
    }

    /** 처음부터 해시를 다시 계산해 체인이 끊긴 첫 행을 찾는다. */
    @Transactional(readOnly = true)
    public Map<String, Object> verify() {
        List<PrivacyAccessLog> all = repository.findAllByOrderByIdAsc();
        String prev = null;
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("total", all.size());
        for (PrivacyAccessLog l : all) {
            String expected = hash(prev, l.getAdminId(), l.getAdminName(), l.getIpAddress(), l.getAction(),
                    l.getSubjectMemberId(), l.getSubjectCount(), l.getReason(), l.getDetail(), l.getAccessedAt());
            boolean linkOk = (prev == null ? l.getPrevHash() == null : prev.equals(l.getPrevHash()));
            if (!linkOk || !expected.equals(l.getHash())) {
                result.put("valid", false);
                result.put("brokenAtId", l.getId());
                return result;
            }
            prev = l.getHash();
        }
        result.put("valid", true);
        return result;
    }

    static String hash(String prev, Long adminId, String adminName, String ip, String action, Long subjectId,
                       Integer subjectCount, String reason, String detail, LocalDateTime at) {
        String payload = String.join("\u001F", String.valueOf(prev), String.valueOf(adminId), String.valueOf(adminName),
                String.valueOf(ip), action, String.valueOf(subjectId), String.valueOf(subjectCount),
                String.valueOf(reason), String.valueOf(detail), at.truncatedTo(ChronoUnit.MICROS).toString());
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private static String clientIp() {
        if (!(RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attrs)) return null;
        HttpServletRequest req = attrs.getRequest();
        String forwarded = req.getHeader("X-Forwarded-For");
        String ip = (forwarded != null && !forwarded.isBlank()) ? forwarded.split(",")[0].trim() : req.getRemoteAddr();
        return truncate(ip, 45);
    }

    private static String truncate(String s, int max) {
        return s == null || s.length() <= max ? s : s.substring(0, max);
    }
}

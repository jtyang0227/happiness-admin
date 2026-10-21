package com.happiness.admin.service;

import com.happiness.admin.dto.PageResponse;
import com.happiness.admin.dto.SecurityAuditLogDto;
import com.happiness.admin.entity.Member;
import com.happiness.admin.entity.SecurityAuditLog;
import com.happiness.admin.repository.MemberRepository;
import com.happiness.admin.repository.SecurityAuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminSecurityAuditService {

    private final SecurityAuditLogRepository auditLogRepository;
    private final MemberRepository memberRepository;

    public PageResponse<SecurityAuditLogDto> getLogs(String actionType, Boolean success, Long memberId,
                                                     String ip, int days, int page, int size) {
        String typeTerm = (actionType != null && !actionType.isBlank()) ? actionType : null;
        String ipTerm = (ip != null && !ip.isBlank()) ? ip.trim() : null;
        LocalDateTime since = LocalDateTime.now().minusDays(Math.max(1, Math.min(days, 90)));
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending().and(Sort.by("id").descending()));
        var logs = auditLogRepository.search(typeTerm, success, memberId, ipTerm, since, pageable);

        List<Long> memberIds = logs.getContent().stream().map(SecurityAuditLog::getMemberId)
                .filter(Objects::nonNull).distinct().toList();
        Map<Long, String> names = memberIds.isEmpty() ? Map.of()
                : memberRepository.findAllById(memberIds).stream().collect(Collectors.toMap(Member::getId, Member::getName));

        return PageResponse.of(logs.map(l -> SecurityAuditLogDto.from(l,
                l.getMemberId() != null ? names.get(l.getMemberId()) : null)));
    }

    public Map<String, Object> getSummary() {
        LocalDateTime dayAgo = LocalDateTime.now().minusHours(24);
        LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("loginFailures24h", auditLogRepository.countByActionTypeAndCreatedAtGreaterThanEqual("LOGIN_FAILURE", dayAgo));
        summary.put("loginSuccess24h", auditLogRepository.countByActionTypeAndCreatedAtGreaterThanEqual("LOGIN_SUCCESS", dayAgo));
        summary.put("adminApi7d", auditLogRepository.countByActionTypeAndCreatedAtGreaterThanEqual("ADMIN_API", weekAgo));
        summary.put("topFailureIps", auditLogRepository.topLoginFailureIps(dayAgo, PageRequest.of(0, 5)).stream()
                .map(r -> Map.of("ip", r[0], "count", r[1], "lastAt", r[2]))
                .toList());
        return summary;
    }
}

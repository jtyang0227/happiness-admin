package com.happiness.admin.service;

import com.happiness.admin.dto.PageResponse;
import com.happiness.admin.entity.PrivacyAccessLog;
import com.happiness.admin.privacy.PrivacyAccessRecorder;
import com.happiness.admin.repository.PrivacyAccessLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminPrivacyLogService {

    private static final List<String> ACTIONS = List.of("LIST", "VIEW", "REVEAL", "EXPORT", "INSPECTION");

    private final PrivacyAccessLogRepository repository;
    private final PrivacyAccessRecorder recorder;

    public PageResponse<Map<String, Object>> getLogs(String action, Long adminId, Long subjectMemberId,
                                                     int days, int page, int size) {
        String act = (action != null && !action.isBlank()) ? action : null;
        LocalDateTime since = LocalDateTime.now().minusDays(Math.max(1, Math.min(days, 730)));
        var logs = repository.search(act, adminId, subjectMemberId, since,
                PageRequest.of(page, size, Sort.by("id").descending()));
        return PageResponse.of(logs.map(AdminPrivacyLogService::toRow));
    }

    public Map<String, Object> getSummary() {
        LocalDateTime since = LocalDateTime.now().minusDays(30);
        Map<String, Object> summary = new LinkedHashMap<>();
        Map<String, Long> counts = new LinkedHashMap<>();
        ACTIONS.forEach(a -> counts.put(a, repository.countByActionAndAccessedAtGreaterThanEqual(a, since)));
        summary.put("counts30d", counts);
        summary.put("lastInspection", repository.findTopByActionOrderByIdDesc("INSPECTION").map(AdminPrivacyLogService::toRow).orElse(null));
        summary.put("retentionYears", 2);
        return summary;
    }

    public Map<String, Object> verify() {
        return recorder.verify();
    }

    public void recordInspection(String note) {
        String why = PrivacyAccessRecorder.requireReason(note);
        recorder.record("INSPECTION", null, null, why, "접속기록·다운로드 내역 점검 완료");
    }

    private static Map<String, Object> toRow(PrivacyAccessLog l) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", l.getId());
        row.put("adminId", l.getAdminId());
        row.put("adminName", l.getAdminName());
        row.put("ipAddress", l.getIpAddress());
        row.put("action", l.getAction());
        row.put("subjectMemberId", l.getSubjectMemberId());
        row.put("subjectCount", l.getSubjectCount());
        row.put("reason", l.getReason());
        row.put("detail", l.getDetail());
        row.put("accessedAt", l.getAccessedAt());
        row.put("hash", l.getHash());
        return row;
    }
}

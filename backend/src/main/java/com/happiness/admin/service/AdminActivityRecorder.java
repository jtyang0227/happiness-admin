package com.happiness.admin.service;

import com.happiness.admin.entity.AdminActivityLog;
import com.happiness.admin.repository.AdminActivityLogRepository;
import com.happiness.admin.security.CurrentAdminProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AdminActivityRecorder {

    private final AdminActivityLogRepository activityLogRepository;
    private final CurrentAdminProvider currentAdmin;

    public void record(String action, String targetType, Long targetId, String details) {
        AdminActivityLog.AdminActivityLogBuilder log = AdminActivityLog.builder()
                .action(action).targetType(targetType).targetId(targetId).details(details);
        currentAdmin.get().ifPresent(m -> log.adminId(m.getId()).adminName(m.getName()));
        activityLogRepository.save(log.build());
    }

    /** 스케줄러처럼 요청 컨텍스트 없이 실행되는 동작 — 관리자명을 "시스템"으로 남긴다. */
    public void recordSystem(String action, String targetType, Long targetId, String details) {
        activityLogRepository.save(AdminActivityLog.builder()
                .adminName("시스템").action(action).targetType(targetType).targetId(targetId).details(details)
                .build());
    }
}

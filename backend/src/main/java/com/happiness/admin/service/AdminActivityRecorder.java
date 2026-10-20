package com.happiness.admin.service;

import com.happiness.admin.entity.AdminActivityLog;
import com.happiness.admin.repository.AdminActivityLogRepository;
import com.happiness.admin.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AdminActivityRecorder {

    private final AdminActivityLogRepository activityLogRepository;
    private final MemberRepository memberRepository;

    public void record(String action, String targetType, Long targetId, String details) {
        AdminActivityLog.AdminActivityLogBuilder log = AdminActivityLog.builder()
                .action(action).targetType(targetType).targetId(targetId).details(details);
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof String email) {
            memberRepository.findByEmail(email).ifPresent(m -> log.adminId(m.getId()).adminName(m.getName()));
        }
        activityLogRepository.save(log.build());
    }
}

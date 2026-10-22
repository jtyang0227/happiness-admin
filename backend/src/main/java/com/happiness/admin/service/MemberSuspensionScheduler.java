package com.happiness.admin.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class MemberSuspensionScheduler {

    private final AdminMemberService memberService;

    @Scheduled(fixedDelayString = "${admin.member.suspension-check-ms:600000}", initialDelay = 30000)
    public void releaseExpired() {
        int released = memberService.releaseExpiredSuspensions();
        if (released > 0) {
            log.info("[MEMBER] 정지 기간 만료 자동 해제 {}명", released);
        }
    }
}

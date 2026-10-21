package com.happiness.admin.controller;

import com.happiness.admin.service.AdminSecurityAuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/security-audit")
@RequiredArgsConstructor
public class AdminSecurityAuditController {

    private final AdminSecurityAuditService securityAuditService;

    @GetMapping
    public ResponseEntity<?> list(
            @RequestParam(required = false) String actionType,
            @RequestParam(required = false) Boolean success,
            @RequestParam(required = false) Long memberId,
            @RequestParam(required = false) String ip,
            @RequestParam(defaultValue = "7") int days,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        return ResponseEntity.ok(securityAuditService.getLogs(actionType, success, memberId, ip, days, page, size));
    }

    @GetMapping("/summary")
    public ResponseEntity<?> summary() {
        return ResponseEntity.ok(securityAuditService.getSummary());
    }
}

package com.happiness.admin.controller;

import com.happiness.admin.service.AdminContentPolicyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/content-policy")
@RequiredArgsConstructor
public class AdminContentPolicyController {

    private final AdminContentPolicyService policyService;

    @GetMapping
    public ResponseEntity<?> getPolicy() {
        return ResponseEntity.ok(policyService.getPolicy());
    }

    @PatchMapping
    public ResponseEntity<?> updatePolicy(@RequestBody Map<String, String> updates) {
        return ResponseEntity.ok(policyService.updatePolicy(updates));
    }

    @GetMapping("/maintenance")
    public ResponseEntity<?> maintenanceStatus() {
        return ResponseEntity.ok(Map.of("enabled", policyService.isMaintenanceEnabled()));
    }

    @PostMapping("/maintenance/toggle")
    public ResponseEntity<?> toggleMaintenance(@RequestBody Map<String, Boolean> body) {
        boolean enabled = Boolean.TRUE.equals(body.get("enabled"));
        policyService.updatePolicy(Map.of("maintenance.enabled", String.valueOf(enabled)));
        return ResponseEntity.ok(Map.of("enabled", enabled, "message",
                enabled ? "유지보수 모드가 활성화되었습니다." : "유지보수 모드가 비활성화되었습니다."));
    }
}

package com.happiness.admin.controller;

import com.happiness.admin.service.AdminPrivacyLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** 개인정보 접속기록 조회·무결성 검증·점검 기록 — 웹관리자(개인정보 보호책임자 역할)만. 수정·삭제 API는 의도적으로 없다. */
@RestController
@RequestMapping("/api/admin/privacy-logs")
@PreAuthorize("hasRole('WM')")
@RequiredArgsConstructor
public class AdminPrivacyLogController {

    private final AdminPrivacyLogService privacyLogService;

    @GetMapping
    public ResponseEntity<?> list(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) Long adminId,
            @RequestParam(required = false) Long subjectMemberId,
            @RequestParam(defaultValue = "30") int days,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        return ResponseEntity.ok(privacyLogService.getLogs(action, adminId, subjectMemberId, days, page, size));
    }

    @GetMapping("/summary")
    public ResponseEntity<?> summary() {
        return ResponseEntity.ok(privacyLogService.getSummary());
    }

    @GetMapping("/verify")
    public ResponseEntity<?> verify() {
        return ResponseEntity.ok(privacyLogService.verify());
    }

    @PostMapping("/inspections")
    public ResponseEntity<?> inspect(@RequestBody Map<String, String> body) {
        privacyLogService.recordInspection(body.get("note"));
        return ResponseEntity.ok(Map.of("message", "점검 기록을 남겼습니다."));
    }
}

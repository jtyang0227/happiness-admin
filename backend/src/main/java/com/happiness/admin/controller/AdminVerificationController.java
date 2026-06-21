package com.happiness.admin.controller;

import com.happiness.admin.dto.VerificationRejectRequest;
import com.happiness.admin.service.AdminVerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/verifications")
@RequiredArgsConstructor
public class AdminVerificationController {

    private final AdminVerificationService verificationService;

    @GetMapping
    public ResponseEntity<?> list(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(verificationService.getVerifications(status, page, size));
    }

    @GetMapping("/counts")
    public ResponseEntity<?> counts() {
        return ResponseEntity.ok(verificationService.getCounts());
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approve(@PathVariable Long id) {
        return ResponseEntity.ok(verificationService.approve(id));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<?> reject(@PathVariable Long id, @RequestBody VerificationRejectRequest req) {
        return ResponseEntity.ok(verificationService.reject(id, req.getReason()));
    }
}

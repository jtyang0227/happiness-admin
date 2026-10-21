package com.happiness.admin.controller;

import com.happiness.admin.service.AdminNewsletterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/newsletter")
@RequiredArgsConstructor
public class AdminNewsletterController {

    private final AdminNewsletterService newsletterService;

    @GetMapping
    public ResponseEntity<?> list(
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        return ResponseEntity.ok(newsletterService.getSubscribers(active, search, page, size));
    }

    @GetMapping("/counts")
    public ResponseEntity<?> counts() {
        return ResponseEntity.ok(newsletterService.getCounts());
    }

    @PostMapping("/export")
    public ResponseEntity<?> export() {
        return ResponseEntity.ok(newsletterService.exportActive());
    }
}

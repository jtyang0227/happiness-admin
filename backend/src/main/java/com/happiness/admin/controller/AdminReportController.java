package com.happiness.admin.controller;

import com.happiness.admin.dto.ReportProcessRequest;
import com.happiness.admin.service.AdminReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
public class AdminReportController {

    private final AdminReportService reportService;

    @GetMapping
    public ResponseEntity<?> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String targetType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(reportService.getReports(status, targetType, page, size));
    }

    @GetMapping("/counts")
    public ResponseEntity<?> counts() {
        return ResponseEntity.ok(reportService.getCounts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> detail(@PathVariable Long id) {
        return ResponseEntity.ok(reportService.getReport(id));
    }

    @PostMapping("/{id}/process")
    public ResponseEntity<?> process(@PathVariable Long id, @RequestBody ReportProcessRequest req) {
        return ResponseEntity.ok(reportService.process(id, req));
    }
}

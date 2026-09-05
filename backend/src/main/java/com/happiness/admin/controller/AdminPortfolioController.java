package com.happiness.admin.controller;

import com.happiness.admin.service.AdminPortfolioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/portfolios")
@RequiredArgsConstructor
public class AdminPortfolioController {

    private final AdminPortfolioService portfolioService;

    @GetMapping
    public ResponseEntity<?> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String visibility,
            @RequestParam(required = false) Long memberId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(portfolioService.getPortfolios(status, visibility, memberId, search, sortBy, page, size));
    }

    @GetMapping("/stats")
    public ResponseEntity<?> stats() {
        return ResponseEntity.ok(portfolioService.getStatusCounts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> detail(@PathVariable Long id) {
        return ResponseEntity.ok(portfolioService.getPortfolio(id));
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<?> approve(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body) {
        String note = body != null ? body.getOrDefault("adminNote", null) : null;
        return ResponseEntity.ok(portfolioService.approve(id, note));
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<?> reject(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String note = body.getOrDefault("adminNote", "");
        return ResponseEntity.ok(portfolioService.reject(id, note));
    }

    @PatchMapping("/{id}/hide")
    public ResponseEntity<?> hide(@PathVariable Long id) {
        return ResponseEntity.ok(portfolioService.hide(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        portfolioService.delete(id);
        return ResponseEntity.ok(Map.of("message", "포트폴리오가 삭제되었습니다."));
    }
}

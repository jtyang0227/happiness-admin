package com.happiness.admin.controller;

import com.happiness.admin.service.AdminStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/stats")
@RequiredArgsConstructor
public class AdminStatsController {

    private final AdminStatsService statsService;

    @GetMapping("/summary")
    public ResponseEntity<?> summary() {
        return ResponseEntity.ok(statsService.getSummary());
    }

    @GetMapping("/daily")
    public ResponseEntity<?> daily(@RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(statsService.getDaily(days));
    }

    @GetMapping("/top-photos")
    public ResponseEntity<?> topPhotos(@RequestParam(defaultValue = "likes") String sortBy) {
        return ResponseEntity.ok(statsService.getTopPhotos(sortBy));
    }

    @GetMapping("/mood-dist")
    public ResponseEntity<?> moodDist() {
        return ResponseEntity.ok(statsService.getMoodDistribution());
    }

    @GetMapping("/shoot-type-dist")
    public ResponseEntity<?> shootTypeDist() {
        return ResponseEntity.ok(statsService.getShootTypeDistribution());
    }
}

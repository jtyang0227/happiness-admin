package com.happiness.admin.controller;

import com.happiness.admin.service.AdminSeriesService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/series")
@RequiredArgsConstructor
public class AdminSeriesController {

    private final AdminSeriesService seriesService;

    @GetMapping
    public ResponseEntity<?> list(
            @RequestParam(required = false) Long memberId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(seriesService.getSeries(memberId, search, sortBy, page, size));
    }

    @GetMapping("/curation")
    public ResponseEntity<?> curation(
            @RequestParam(required = false) Boolean featured,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "24") int size) {
        return ResponseEntity.ok(seriesService.getCurationCandidates(featured, search, page, size));
    }

    @PutMapping("/{id}/featured")
    public ResponseEntity<?> setFeatured(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        if (!(body.get("featured") instanceof Boolean featured)) {
            throw new IllegalArgumentException("featured(true/false)가 필요합니다.");
        }
        return ResponseEntity.ok(seriesService.setFeatured(id, featured));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> detail(@PathVariable Long id) {
        return ResponseEntity.ok(seriesService.getSeriesDetail(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        seriesService.deleteSeries(id);
        return ResponseEntity.ok(Map.of("message", "시리즈가 삭제되었습니다."));
    }
}

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
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(seriesService.getSeries(memberId, search, page, size));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        seriesService.deleteSeries(id);
        return ResponseEntity.ok(Map.of("message", "시리즈가 삭제되었습니다."));
    }
}

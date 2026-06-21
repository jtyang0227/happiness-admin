package com.happiness.admin.controller;

import com.happiness.admin.dto.BannerRequest;
import com.happiness.admin.service.AdminBannerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/banners")
@RequiredArgsConstructor
public class AdminBannerController {

    private final AdminBannerService bannerService;

    @GetMapping
    public ResponseEntity<?> list() {
        return ResponseEntity.ok(bannerService.getBanners());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody BannerRequest req) {
        return ResponseEntity.ok(bannerService.createBanner(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody BannerRequest req) {
        return ResponseEntity.ok(bannerService.updateBanner(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        bannerService.deleteBanner(id);
        return ResponseEntity.ok(Map.of("message", "배너가 삭제되었습니다."));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<?> toggle(@PathVariable Long id) {
        return ResponseEntity.ok(bannerService.toggleActive(id));
    }

    @PatchMapping("/reorder")
    public ResponseEntity<?> reorder(@RequestBody BannerRequest req) {
        bannerService.reorder(req.getOrderedIds());
        return ResponseEntity.ok(Map.of("message", "순서가 저장되었습니다."));
    }
}

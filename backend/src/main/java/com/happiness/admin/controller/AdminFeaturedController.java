package com.happiness.admin.controller;

import com.happiness.admin.dto.FeaturedRequest;
import com.happiness.admin.service.AdminFeaturedService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/featured")
@RequiredArgsConstructor
public class AdminFeaturedController {

    private final AdminFeaturedService featuredService;

    @GetMapping
    public ResponseEntity<?> list() {
        return ResponseEntity.ok(featuredService.getFeatured());
    }

    @PostMapping
    public ResponseEntity<?> add(@RequestBody FeaturedRequest req, Authentication auth) {
        Long adminId = resolveAdminId(auth);
        return ResponseEntity.ok(featuredService.addFeatured(req, adminId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> remove(@PathVariable Long id) {
        featuredService.removeFeatured(id);
        return ResponseEntity.ok(Map.of("message", "피처드에서 제거되었습니다."));
    }

    @PatchMapping("/reorder")
    public ResponseEntity<?> reorder(@RequestBody Map<String, java.util.List<Long>> body) {
        return ResponseEntity.ok(featuredService.reorder(body.get("orderedIds")));
    }

    private Long resolveAdminId(Authentication auth) {
        if (auth == null) return null;
        try {
            return Long.parseLong(auth.getName());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}

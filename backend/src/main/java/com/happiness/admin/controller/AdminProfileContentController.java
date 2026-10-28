package com.happiness.admin.controller;

import com.happiness.admin.service.AdminProfileContentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/profile-content")
@RequiredArgsConstructor
public class AdminProfileContentController {

    private final AdminProfileContentService profileContentService;

    @GetMapping
    public ResponseEntity<?> list(
            @RequestParam String type,
            @RequestParam(required = false) Long memberId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(profileContentService.getContents(type, memberId, page, size));
    }

    @GetMapping("/counts")
    public ResponseEntity<?> counts() {
        return ResponseEntity.ok(profileContentService.getCounts());
    }

    @DeleteMapping("/{type}/{id}")
    public ResponseEntity<?> delete(@PathVariable String type, @PathVariable Long id) {
        profileContentService.delete(type, id);
        return ResponseEntity.ok(Map.of("message", "삭제되었습니다."));
    }
}

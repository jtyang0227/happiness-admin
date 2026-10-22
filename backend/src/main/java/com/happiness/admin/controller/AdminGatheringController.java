package com.happiness.admin.controller;

import com.happiness.admin.service.AdminGatheringService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/gatherings")
@RequiredArgsConstructor
public class AdminGatheringController {

    private final AdminGatheringService gatheringService;

    @GetMapping
    public ResponseEntity<?> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(gatheringService.getGatherings(status, search, page, size));
    }

    @GetMapping("/counts")
    public ResponseEntity<?> counts() {
        return ResponseEntity.ok(gatheringService.getCounts());
    }

    @GetMapping("/{id}/posts")
    public ResponseEntity<?> posts(@PathVariable Long id) {
        return ResponseEntity.ok(gatheringService.getPosts(id));
    }

    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<?> deletePost(@PathVariable Long postId) {
        gatheringService.deletePost(postId);
        return ResponseEntity.ok(Map.of("message", "게시글이 삭제되었습니다."));
    }
}

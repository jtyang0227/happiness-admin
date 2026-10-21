package com.happiness.admin.controller;

import com.happiness.admin.service.AdminCommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/comments")
@RequiredArgsConstructor
public class AdminCommentController {

    private final AdminCommentService commentService;

    @GetMapping
    public ResponseEntity<?> list(
            @RequestParam(required = false) Long photoId,
            @RequestParam(required = false) Long memberId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(commentService.getComments(photoId, memberId, search, page, size));
    }

    @GetMapping("/counts")
    public ResponseEntity<?> counts() {
        return ResponseEntity.ok(commentService.getCounts());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        int deleted = commentService.deleteComment(id);
        return ResponseEntity.ok(Map.of("message", "댓글이 삭제되었습니다.", "deleted", deleted));
    }
}

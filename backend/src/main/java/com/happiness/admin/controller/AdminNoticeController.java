package com.happiness.admin.controller;

import com.happiness.admin.dto.NoticeRequest;
import com.happiness.admin.service.AdminNoticeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/notices")
@RequiredArgsConstructor
public class AdminNoticeController {

    private final AdminNoticeService noticeService;

    @GetMapping
    public ResponseEntity<?> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(noticeService.getNotices(status, type, search, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> detail(@PathVariable Long id) {
        return ResponseEntity.ok(noticeService.getNotice(id));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody NoticeRequest req) {
        return ResponseEntity.ok(noticeService.createNotice(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody NoticeRequest req) {
        return ResponseEntity.ok(noticeService.updateNotice(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        noticeService.deleteNotice(id);
        return ResponseEntity.ok(Map.of("message", "공지사항이 삭제되었습니다."));
    }
}

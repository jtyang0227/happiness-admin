package com.happiness.admin.controller;

import com.happiness.admin.service.AdminInquiryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/inquiries")
@RequiredArgsConstructor
public class AdminInquiryController {

    private final AdminInquiryService inquiryService;

    @GetMapping
    public ResponseEntity<?> list(
            @RequestParam(required = false) Long receiverId,
            @RequestParam(required = false) Long senderId,
            @RequestParam(required = false) Boolean isRead,
            @RequestParam(required = false) String shootType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(inquiryService.getInquiries(receiverId, senderId, isRead, shootType, page, size));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable Long id) {
        inquiryService.markRead(id);
        return ResponseEntity.ok(Map.of("message", "읽음 처리되었습니다."));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<?> markAllRead() {
        int count = inquiryService.markAllRead();
        return ResponseEntity.ok(Map.of("message", "모든 미읽음 문의를 읽음 처리했습니다.", "count", count));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        inquiryService.deleteInquiry(id);
        return ResponseEntity.ok(Map.of("message", "문의가 삭제되었습니다."));
    }
}

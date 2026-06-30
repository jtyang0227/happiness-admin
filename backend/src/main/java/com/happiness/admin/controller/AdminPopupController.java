package com.happiness.admin.controller;

import com.happiness.admin.dto.PopupRequest;
import com.happiness.admin.service.AdminPopupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/popups")
@RequiredArgsConstructor
public class AdminPopupController {

    private final AdminPopupService popupService;

    @GetMapping
    public ResponseEntity<?> list() {
        return ResponseEntity.ok(popupService.getPopups());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody PopupRequest req) {
        return ResponseEntity.ok(popupService.createPopup(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody PopupRequest req) {
        return ResponseEntity.ok(popupService.updatePopup(id, req));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<?> toggle(@PathVariable Long id) {
        return ResponseEntity.ok(popupService.togglePopup(id));
    }

    @PatchMapping("/reorder")
    public ResponseEntity<?> reorder(@RequestBody PopupRequest req) {
        popupService.reorderPopups(req.getOrderedIds());
        return ResponseEntity.ok(Map.of("message", "순서가 저장되었습니다."));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        popupService.deletePopup(id);
        return ResponseEntity.ok(Map.of("message", "팝업이 삭제되었습니다."));
    }
}

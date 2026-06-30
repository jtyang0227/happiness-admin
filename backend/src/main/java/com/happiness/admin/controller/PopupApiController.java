package com.happiness.admin.controller;

import com.happiness.admin.service.AdminPopupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// happiness-app에서 JWT 없이 호출하는 공개 팝업 API
@RestController
@RequestMapping("/api/popups")
@RequiredArgsConstructor
public class PopupApiController {

    private final AdminPopupService popupService;

    @GetMapping("/active")
    public ResponseEntity<?> active(@RequestParam(defaultValue = "HOME") String screen) {
        return ResponseEntity.ok(popupService.getActivePopups(screen));
    }
}

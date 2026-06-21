package com.happiness.admin.controller;

import com.happiness.admin.service.AdminPhotoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/photos")
@RequiredArgsConstructor
public class AdminPhotoController {

    private final AdminPhotoService photoService;

    @GetMapping
    public ResponseEntity<?> list(
            @RequestParam(required = false) Long memberId,
            @RequestParam(required = false) String colorMood,
            @RequestParam(required = false) String l1,
            @RequestParam(required = false) String l2,
            @RequestParam(required = false) String l3,
            @RequestParam(required = false) String l4,
            @RequestParam(required = false) String l5,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "latest") String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "24") int size) {
        return ResponseEntity.ok(photoService.getPhotos(memberId, colorMood, l1, l2, l3, l4, l5, search, sortBy, page, size));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        photoService.deletePhoto(id);
        return ResponseEntity.ok(Map.of("message", "사진이 삭제되었습니다."));
    }

    @PatchMapping("/{id}/category-code")
    public ResponseEntity<?> updateCategoryCode(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String code = body.get("categoryCode");
        return ResponseEntity.ok(photoService.updateCategoryCode(id, code));
    }
}

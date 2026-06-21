package com.happiness.admin.controller;

import com.happiness.admin.service.AdminCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/categories")
@RequiredArgsConstructor
public class AdminCategoryController {
    private final AdminCategoryService categoryService;

    @GetMapping
    public ResponseEntity<?> list(@RequestParam(required = false) Integer level) {
        if (level != null) return ResponseEntity.ok(categoryService.getByLevel(level));
        return ResponseEntity.ok(categoryService.getAll());
    }
}

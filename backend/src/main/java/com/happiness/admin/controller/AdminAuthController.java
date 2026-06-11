package com.happiness.admin.controller;

import com.happiness.admin.dto.LoginRequest;
import com.happiness.admin.dto.LoginResponse;
import com.happiness.admin.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth/admin")
@RequiredArgsConstructor
public class AdminAuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody LoginRequest request) {
        LoginResponse response = authService.adminLogin(request);
        return ResponseEntity.ok(Map.of("status", "success", "data", response));
    }
}

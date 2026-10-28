package com.happiness.admin.controller;

import com.happiness.admin.dto.LoginRequest;
import com.happiness.admin.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 관리자 로그인 전용. 회원가입·이메일 확인·회원 조회·OAuth는 App의 책임이라 Admin에 두지 않는다 —
 * 과거 이 컨트롤러의 공개 `GET /member/{id}`가 비로그인으로 회원 이메일·전화번호를 반환하던 결함이 있었다
 * (docs/planning/PRIVACY_PROTECTION_PLAN.md F1).
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            return ResponseEntity.ok(authService.adminLogin(request));
        } catch (AuthService.LoginLockedException e) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of("message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
        }
    }
}

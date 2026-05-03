package com.happiness.admin.controller;

import com.happiness.admin.dto.LoginRequest;
import com.happiness.admin.dto.MemberResponse;
import com.happiness.admin.dto.SignUpRequest;
import com.happiness.admin.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AuthController {
    
    private final MemberService memberService;
    
    /**
     * 회원 가입
     * POST /api/auth/signup
     */
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignUpRequest request) {
        try {
            MemberResponse response = memberService.signUp(request);
            Map<String, Object> result = new HashMap<>();
            result.put("status", "success");
            result.put("message", "회원 가입이 완료되었습니다.");
            result.put("data", response);
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (IllegalArgumentException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("status", "error");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("status", "error");
            error.put("message", "회원 가입 중 오류가 발생했습니다.");
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * 로그인
     * POST /api/auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            MemberResponse response = memberService.login(request);
            Map<String, Object> result = new HashMap<>();
            result.put("status", "success");
            result.put("message", "로그인에 성공했습니다.");
            result.put("data", response);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("status", "error");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("status", "error");
            error.put("message", "로그인 중 오류가 발생했습니다.");
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * 이메일 중복 확인
     * GET /api/auth/check-email?email=test@example.com
     */
    @GetMapping("/check-email")
    public ResponseEntity<?> checkEmail(@RequestParam String email) {
        try {
            // 실제로는 memberService에서 체크하는 로직이 필요합니다
            // 여기서는 간단히 구현
            Map<String, Object> result = new HashMap<>();
            result.put("status", "success");
            result.put("available", true);
            result.put("email", email);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("status", "error");
            error.put("message", "이메일 확인 중 오류가 발생했습니다.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * Google OAuth2 콜백
     * POST /api/auth/oauth/google
     */
    @PostMapping("/oauth/google")
    public ResponseEntity<?> googleOAuth(@RequestParam String idToken) {
        try {
            // 실제로는 Google ID Token을 검증해야 합니다
            // 여기서는 임시 구현
            Map<String, Object> result = new HashMap<>();
            result.put("status", "success");
            result.put("message", "Google OAuth2 로그인 준비됨");
            result.put("redirectUrl", "/api/auth/oauth/google/callback");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("status", "error");
            error.put("message", "Google OAuth2 처리 중 오류가 발생했습니다.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * Naver OAuth2 콜백
     * POST /api/auth/oauth/naver
     */
    @PostMapping("/oauth/naver")
    public ResponseEntity<?> naverOAuth(@RequestParam String accessToken) {
        try {
            // 실제로는 Naver Access Token을 검증해야 합니다
            Map<String, Object> result = new HashMap<>();
            result.put("status", "success");
            result.put("message", "Naver OAuth2 로그인 준비됨");
            result.put("redirectUrl", "/api/auth/oauth/naver/callback");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("status", "error");
            error.put("message", "Naver OAuth2 처리 중 오류가 발생했습니다.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * 회원 조회
     * GET /api/auth/member/{id}
     */
    @GetMapping("/member/{id}")
    public ResponseEntity<?> getMember(@PathVariable Long id) {
        try {
            MemberResponse response = memberService.getMember(id);
            Map<String, Object> result = new HashMap<>();
            result.put("status", "success");
            result.put("data", response);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("status", "error");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }
}

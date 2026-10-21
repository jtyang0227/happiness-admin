package com.happiness.admin.service;

import com.happiness.admin.dto.LoginRequest;
import com.happiness.admin.dto.LoginResponse;
import com.happiness.admin.entity.Authority;
import com.happiness.admin.entity.Member;
import com.happiness.admin.entity.MemberStatus;
import com.happiness.admin.repository.MemberRepository;
import com.happiness.admin.security.JwtTokenProvider;
import com.happiness.admin.security.LoginAttemptLimiter;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final LoginAttemptLimiter loginAttemptLimiter;

    /** 실패 사유를 구분하지 않는 단일 메시지 — 계정 존재 여부를 응답으로 알 수 없게 한다. */
    static final String LOGIN_FAILED = "이메일 또는 비밀번호가 올바르지 않습니다.";

    /** 존재하지 않는 계정에도 BCrypt 비교를 수행해 응답 시간으로 계정 유무를 추측하지 못하게 하는 더미 해시. */
    private volatile String dummyHash;

    private String dummyHash() {
        if (dummyHash == null) dummyHash = passwordEncoder.encode(UUID.randomUUID().toString());
        return dummyHash;
    }

    public static class LoginLockedException extends RuntimeException {
        public LoginLockedException(String message) { super(message); }
    }

    public LoginResponse adminLogin(LoginRequest request) {
        Duration lock = loginAttemptLimiter.remainingLock(request.getEmail());
        if (!lock.isZero()) {
            throw new LoginLockedException("로그인 시도가 너무 많습니다. " + Math.max(1, lock.toMinutes() + 1) + "분 후 다시 시도해 주세요.");
        }
        Member member = memberRepository.findByEmail(request.getEmail()).orElse(null);
        boolean passwordOk = passwordEncoder.matches(
                request.getPassword() == null ? "" : request.getPassword(),
                member != null && member.getPassword() != null ? member.getPassword() : dummyHash());
        boolean isAdmin = member != null
                && (member.getAuthority() == Authority.WM || member.getAuthority() == Authority.SA);
        if (member == null || !passwordOk || !isAdmin || member.getStatus() != MemberStatus.ACTIVE) {
            loginAttemptLimiter.recordFailure(request.getEmail());
            throw new IllegalArgumentException(LOGIN_FAILED);
        }
        loginAttemptLimiter.recordSuccess(request.getEmail());

        String token = jwtTokenProvider.createToken(member.getEmail(), member.getAuthority());

        return LoginResponse.builder()
                .token(token)
                .memberId(member.getId())
                .email(member.getEmail())
                .name(member.getName())
                .profileName(member.getProfileName())
                .authority(member.getAuthority().name())
                .build();
    }
}

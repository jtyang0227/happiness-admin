package com.happiness.admin.service;

import com.happiness.admin.dto.LoginRequest;
import com.happiness.admin.dto.LoginResponse;
import com.happiness.admin.entity.Authority;
import com.happiness.admin.entity.Member;
import com.happiness.admin.entity.MemberStatus;
import com.happiness.admin.repository.MemberRepository;
import com.happiness.admin.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public LoginResponse adminLogin(LoginRequest request) {
        Member member = memberRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("가입되지 않은 이메일입니다."));

        if (!passwordEncoder.matches(request.getPassword(), member.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        if (member.getStatus() != MemberStatus.ACTIVE) {
            throw new IllegalArgumentException("비활성화된 계정입니다.");
        }

        if (member.getAuthority() != Authority.WM && member.getAuthority() != Authority.SA) {
            throw new IllegalArgumentException("관리자 권한이 없습니다.");
        }

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

package com.happiness.admin.security;

import com.happiness.admin.entity.Member;
import com.happiness.admin.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

/** JWT 필터가 principal에 이메일을 넣으므로, 요청 중인 관리자 Member를 이메일로 찾는다. */
@Component
@RequiredArgsConstructor
public class CurrentAdminProvider {

    private final MemberRepository memberRepository;

    public Optional<Member> get() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof String email) {
            return memberRepository.findByEmail(email);
        }
        return Optional.empty();
    }

    public Member require() {
        return get().orElseThrow(() -> new IllegalStateException("관리자 인증 정보가 없습니다."));
    }
}

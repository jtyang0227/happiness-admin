package com.happiness.admin.security;

import com.happiness.admin.entity.Authority;
import com.happiness.admin.entity.MemberStatus;
import com.happiness.admin.repository.MemberRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final MemberRepository memberRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String token = resolveToken(request);
        if (StringUtils.hasText(token) && jwtTokenProvider.validateToken(token)) {
            // 토큰의 권한을 그대로 믿지 않고 매 요청마다 DB의 현재 상태·권한으로 판정한다 —
            // 강등·정지·탈퇴된 관리자가 남은 토큰 유효시간 동안 계속 접근하는 것을 막는다.
            memberRepository.findByEmail(jwtTokenProvider.getEmail(token))
                    .filter(m -> m.getStatus() == MemberStatus.ACTIVE)
                    .filter(m -> m.getAuthority() == Authority.WM || m.getAuthority() == Authority.SA)
                    .ifPresent(m -> SecurityContextHolder.getContext().setAuthentication(
                            new UsernamePasswordAuthenticationToken(m.getEmail(), null,
                                    List.of(new SimpleGrantedAuthority("ROLE_" + m.getAuthority().name())))));
        }
        filterChain.doFilter(request, response);
    }

    private String resolveToken(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (StringUtils.hasText(bearer) && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }
}

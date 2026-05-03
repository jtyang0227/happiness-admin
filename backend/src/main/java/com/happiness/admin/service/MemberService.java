package com.happiness.admin.service;

import com.happiness.admin.dto.LoginRequest;
import com.happiness.admin.dto.MemberResponse;
import com.happiness.admin.dto.SignUpRequest;
import com.happiness.admin.entity.Authority;
import com.happiness.admin.entity.Member;
import com.happiness.admin.entity.MemberStatus;
import com.happiness.admin.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class MemberService {
    
    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    
    /**
     * 새 회원 가입
     */
    public MemberResponse signUp(SignUpRequest request) {
        // 이메일 중복 검사
        if (memberRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("이미 등록된 이메일입니다: " + request.getEmail());
        }
        
        // 약관 동의 확인
        if (!request.isTermsAgreed()) {
            throw new IllegalArgumentException("약관에 동의해야 합니다");
        }
        
        // 새 회원 생성
        Member member = Member.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .tel(request.getTel())
                .status(MemberStatus.ACTIVE)
                .authority(Authority.US)  // 기본 권한: 일반 사용자
                .provider("local")         // 일반 회원가입
                .build();
        
        Member savedMember = memberRepository.save(member);
        return MemberResponse.fromEntity(savedMember);
    }
    
    /**
     * 로그인
     */
    public MemberResponse login(LoginRequest request) {
        Member member = memberRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("가입되지 않은 이메일입니다: " + request.getEmail()));
        
        if (!passwordEncoder.matches(request.getPassword(), member.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다");
        }
        
        if (member.getStatus() != MemberStatus.ACTIVE) {
            throw new IllegalArgumentException("계정 상태가 활성화되지 않았습니다");
        }
        
        return MemberResponse.fromEntity(member);
    }
    
    /**
     * OAuth2 회원 조회 또는 생성
     */
    public MemberResponse findOrCreateOAuthMember(String provider, String providerId, String email, String name) {
        // 기존 OAuth 회원 확인
        Optional<Member> existingMember = memberRepository.findByProviderAndProviderId(provider, providerId);
        if (existingMember.isPresent()) {
            return MemberResponse.fromEntity(existingMember.get());
        }
        
        // 이메일로 이미 등록된 회원 확인
        Optional<Member> emailMember = memberRepository.findByEmail(email);
        if (emailMember.isPresent()) {
            return MemberResponse.fromEntity(emailMember.get());
        }
        
        // 새로운 OAuth 회원 생성
        Member newMember = Member.builder()
                .email(email)
                .name(name)
                .tel("")
                .password(null)  // OAuth 회원은 비밀번호 없음
                .status(MemberStatus.ACTIVE)
                .authority(Authority.US)
                .provider(provider)
                .providerId(providerId)
                .build();
        
        Member savedMember = memberRepository.save(newMember);
        return MemberResponse.fromEntity(savedMember);
    }
    
    /**
     * 회원 조회
     */
    @Transactional(readOnly = true)
    public MemberResponse getMember(Long id) {
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다: " + id));
        return MemberResponse.fromEntity(member);
    }
    
    /**
     * 이메일로 회원 조회
     */
    @Transactional(readOnly = true)
    public MemberResponse getMemberByEmail(String email) {
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다: " + email));
        return MemberResponse.fromEntity(member);
    }
}

package com.happiness.admin.service;

import com.happiness.admin.dto.LoginRequest;
import com.happiness.admin.dto.MemberResponse;
import com.happiness.admin.dto.SignUpRequest;
import com.happiness.admin.entity.Authority;
import com.happiness.admin.entity.Member;
import com.happiness.admin.entity.MemberStatus;
import com.happiness.admin.repository.MemberRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
class MemberServiceTest {

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private MemberService memberService;

    private Member testMember;

    @BeforeEach
    void setUp() {
        testMember = Member.builder()
                .id(1L)
                .email("test@example.com")
                .name("테스트유저")
                .tel("010-1234-5678")
                .password("encodedPassword")
                .status(MemberStatus.ACTIVE)
                .authority(Authority.US)
                .provider("local")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    void signUp_success() {
        SignUpRequest request = SignUpRequest.builder()
                .email("test@example.com")
                .password("password123")
                .name("테스트유저")
                .tel("010-1234-5678")
                .termsAgreed(true)
                .build();

        given(memberRepository.existsByEmail(request.getEmail())).willReturn(false);
        given(passwordEncoder.encode(request.getPassword())).willReturn("encodedPassword");
        given(memberRepository.save(any(Member.class))).willReturn(testMember);

        MemberResponse response = memberService.signUp(request);

        assertThat(response.getEmail()).isEqualTo("test@example.com");
        assertThat(response.getName()).isEqualTo("테스트유저");
        assertThat(response.getStatus()).isEqualTo(MemberStatus.ACTIVE);
    }

    @Test
    void signUp_duplicateEmail_throwsException() {
        SignUpRequest request = SignUpRequest.builder()
                .email("test@example.com")
                .password("password123")
                .name("테스트유저")
                .tel("010-1234-5678")
                .termsAgreed(true)
                .build();

        given(memberRepository.existsByEmail(request.getEmail())).willReturn(true);

        assertThatThrownBy(() -> memberService.signUp(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("이미 등록된 이메일입니다");
    }

    @Test
    void signUp_termsNotAgreed_throwsException() {
        SignUpRequest request = SignUpRequest.builder()
                .email("test@example.com")
                .password("password123")
                .name("테스트유저")
                .tel("010-1234-5678")
                .termsAgreed(false)
                .build();

        given(memberRepository.existsByEmail(request.getEmail())).willReturn(false);

        assertThatThrownBy(() -> memberService.signUp(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("약관에 동의해야 합니다");
    }

    @Test
    void login_success() {
        LoginRequest request = LoginRequest.builder()
                .email("test@example.com")
                .password("password123")
                .build();

        given(memberRepository.findByEmail(request.getEmail())).willReturn(Optional.of(testMember));
        given(passwordEncoder.matches(request.getPassword(), testMember.getPassword())).willReturn(true);

        MemberResponse response = memberService.login(request);

        assertThat(response.getEmail()).isEqualTo("test@example.com");
    }

    @Test
    void login_wrongEmail_throwsException() {
        LoginRequest request = LoginRequest.builder()
                .email("wrong@example.com")
                .password("password123")
                .build();

        given(memberRepository.findByEmail(request.getEmail())).willReturn(Optional.empty());

        assertThatThrownBy(() -> memberService.login(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("가입되지 않은 이메일입니다");
    }

    @Test
    void login_wrongPassword_throwsException() {
        LoginRequest request = LoginRequest.builder()
                .email("test@example.com")
                .password("wrongPassword")
                .build();

        given(memberRepository.findByEmail(request.getEmail())).willReturn(Optional.of(testMember));
        given(passwordEncoder.matches(request.getPassword(), testMember.getPassword())).willReturn(false);

        assertThatThrownBy(() -> memberService.login(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("비밀번호가 일치하지 않습니다");
    }

    @Test
    void getMember_success() {
        given(memberRepository.findById(1L)).willReturn(Optional.of(testMember));

        MemberResponse response = memberService.getMember(1L);

        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getEmail()).isEqualTo("test@example.com");
    }

    @Test
    void getMember_notFound_throwsException() {
        given(memberRepository.findById(99L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> memberService.getMember(99L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("회원을 찾을 수 없습니다");
    }
}

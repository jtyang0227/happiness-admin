package com.happiness.admin.service;

import com.happiness.admin.dto.AdminVerificationDto;
import com.happiness.admin.dto.PageResponse;
import com.happiness.admin.entity.Member;
import com.happiness.admin.entity.VerificationRequest;
import com.happiness.admin.repository.MemberRepository;
import com.happiness.admin.repository.VerificationRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminVerificationService {

    private final VerificationRequestRepository verificationRepository;
    private final MemberRepository memberRepository;

    public PageResponse<AdminVerificationDto> getVerifications(String status, int page, int size) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return PageResponse.of(verificationRepository.searchVerifications(
                (status != null && !status.isBlank()) ? status : null,
                pageable
        ).map(AdminVerificationDto::from));
    }

    public Map<String, Long> getCounts() {
        return Map.of(
                "PENDING", verificationRepository.countByStatus("PENDING"),
                "APPROVED", verificationRepository.countByStatus("APPROVED"),
                "REJECTED", verificationRepository.countByStatus("REJECTED")
        );
    }

    @Transactional
    public AdminVerificationDto approve(Long id) {
        VerificationRequest v = verificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("인증 신청을 찾을 수 없습니다."));
        v.setStatus("APPROVED");
        v.setReviewedAt(LocalDateTime.now());

        Member member = v.getMember();
        member.setVerified(true);
        member.setVerifiedAt(LocalDateTime.now());
        memberRepository.save(member);

        return AdminVerificationDto.from(verificationRepository.save(v));
    }

    @Transactional
    public AdminVerificationDto reject(Long id, String reason) {
        VerificationRequest v = verificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("인증 신청을 찾을 수 없습니다."));
        v.setStatus("REJECTED");
        v.setRejectReason(reason);
        v.setReviewedAt(LocalDateTime.now());
        return AdminVerificationDto.from(verificationRepository.save(v));
    }
}

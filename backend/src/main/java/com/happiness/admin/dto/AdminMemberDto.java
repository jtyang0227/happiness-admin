package com.happiness.admin.dto;

import com.happiness.admin.entity.Member;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AdminMemberDto {
    private Long id;
    private String name;
    private String email;
    private String tel;
    private String profileName;
    private String authority;
    private String status;
    private String suspendReason;
    private LocalDateTime suspendUntil;
    private LocalDateTime suspendedAt;
    private boolean isVerified;
    private LocalDateTime verifiedAt;
    private LocalDateTime createdAt;
    private long photoCount;
    private long seriesCount;
    private long inquiryCount;
    private long portfolioCount;
    private String provider;

    public static AdminMemberDto from(Member m, long photoCount, long seriesCount, long inquiryCount, long portfolioCount) {
        return AdminMemberDto.builder()
                .id(m.getId())
                .name(m.getName())
                .email(m.getEmail())
                .tel(m.getTel())
                .profileName(m.getProfileName())
                .authority(m.getAuthority().name())
                .status(m.getStatus().name())
                .suspendReason(m.getSuspendReason())
                .suspendUntil(m.getSuspendUntil())
                .suspendedAt(m.getSuspendedAt())
                .isVerified(m.isVerified())
                .verifiedAt(m.getVerifiedAt())
                .createdAt(m.getCreatedAt())
                .photoCount(photoCount)
                .seriesCount(seriesCount)
                .inquiryCount(inquiryCount)
                .portfolioCount(portfolioCount)
                .provider(m.getProvider())
                .build();
    }
}

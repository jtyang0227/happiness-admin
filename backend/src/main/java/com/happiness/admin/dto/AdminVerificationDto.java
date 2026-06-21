package com.happiness.admin.dto;

import com.happiness.admin.entity.VerificationRequest;
import lombok.*;

import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AdminVerificationDto {
    private Long id;
    private Long memberId;
    private String memberName;
    private String memberEmail;
    private String memberProfileName;
    private String portfolioUrl;
    private String bio;
    private String status;
    private String rejectReason;
    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;

    public static AdminVerificationDto from(VerificationRequest v) {
        return AdminVerificationDto.builder()
                .id(v.getId())
                .memberId(v.getMember().getId())
                .memberName(v.getMember().getName())
                .memberEmail(v.getMember().getEmail())
                .memberProfileName(v.getMember().getProfileName())
                .portfolioUrl(v.getPortfolioUrl())
                .bio(v.getBio())
                .status(v.getStatus())
                .rejectReason(v.getRejectReason())
                .reviewedAt(v.getReviewedAt())
                .createdAt(v.getCreatedAt())
                .build();
    }
}

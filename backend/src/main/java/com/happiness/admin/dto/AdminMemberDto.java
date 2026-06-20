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
    private String profileName;
    private String authority;
    private String status;
    private LocalDateTime createdAt;
    private long photoCount;
    private long seriesCount;
    private long inquiryCount;
    private String provider;

    public static AdminMemberDto from(Member m, long photoCount, long seriesCount, long inquiryCount) {
        return AdminMemberDto.builder()
                .id(m.getId())
                .name(m.getName())
                .email(m.getEmail())
                .profileName(m.getProfileName())
                .authority(m.getAuthority().name())
                .status(m.getStatus().name())
                .createdAt(m.getCreatedAt())
                .photoCount(photoCount)
                .seriesCount(seriesCount)
                .inquiryCount(inquiryCount)
                .provider(m.getProvider())
                .build();
    }
}

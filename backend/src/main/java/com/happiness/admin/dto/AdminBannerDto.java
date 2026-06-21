package com.happiness.admin.dto;

import com.happiness.admin.entity.Banner;
import lombok.*;

import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AdminBannerDto {
    private Long id;
    private String title;
    private String imageUrl;
    private String linkUrl;
    private boolean isActive;
    private int displayOrder;
    private LocalDateTime startsAt;
    private LocalDateTime endsAt;
    private LocalDateTime createdAt;

    public static AdminBannerDto from(Banner b) {
        return AdminBannerDto.builder()
                .id(b.getId())
                .title(b.getTitle())
                .imageUrl(b.getImageUrl())
                .linkUrl(b.getLinkUrl())
                .isActive(b.isActive())
                .displayOrder(b.getDisplayOrder())
                .startsAt(b.getStartsAt())
                .endsAt(b.getEndsAt())
                .createdAt(b.getCreatedAt())
                .build();
    }
}

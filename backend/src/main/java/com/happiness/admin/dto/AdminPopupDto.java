package com.happiness.admin.dto;

import com.happiness.admin.entity.Popup;
import lombok.*;

import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AdminPopupDto {
    private Long id;
    private String title;
    private String content;
    private String imageUrl;
    private String linkUrl;
    private String targetScreen;
    private boolean isActive;
    private boolean showOnce;
    private int displayOrder;
    private LocalDateTime startsAt;
    private LocalDateTime endsAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static AdminPopupDto from(Popup p) {
        return AdminPopupDto.builder()
                .id(p.getId())
                .title(p.getTitle())
                .content(p.getContent())
                .imageUrl(p.getImageUrl())
                .linkUrl(p.getLinkUrl())
                .targetScreen(p.getTargetScreen())
                .isActive(p.isActive())
                .showOnce(p.isShowOnce())
                .displayOrder(p.getDisplayOrder())
                .startsAt(p.getStartsAt())
                .endsAt(p.getEndsAt())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}

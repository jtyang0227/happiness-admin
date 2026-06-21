package com.happiness.admin.dto;

import com.happiness.admin.entity.Notice;
import lombok.*;

import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AdminNoticeDto {
    private Long id;
    private String type;
    private String title;
    private String content;
    private String status;
    private boolean isPinned;
    private LocalDateTime publishedAt;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static AdminNoticeDto from(Notice n) {
        return AdminNoticeDto.builder()
                .id(n.getId())
                .type(n.getType())
                .title(n.getTitle())
                .content(n.getContent())
                .status(n.getStatus())
                .isPinned(n.isPinned())
                .publishedAt(n.getPublishedAt())
                .expiresAt(n.getExpiresAt())
                .createdAt(n.getCreatedAt())
                .updatedAt(n.getUpdatedAt())
                .build();
    }
}

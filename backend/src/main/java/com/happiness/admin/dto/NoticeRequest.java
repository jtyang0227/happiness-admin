package com.happiness.admin.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor
public class NoticeRequest {
    private String type;
    private String title;
    private String content;
    private String status; // DRAFT / PUBLISHED
    private boolean isPinned;
    private LocalDateTime expiresAt;
}

package com.happiness.admin.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor
public class PopupRequest {
    private String title;
    private String content;
    private String imageUrl;
    private String linkUrl;
    private String targetScreen;
    private boolean isActive;
    private boolean showOnce;
    private LocalDateTime startsAt;
    private LocalDateTime endsAt;
    // reorder 전용
    private List<Long> orderedIds;
}

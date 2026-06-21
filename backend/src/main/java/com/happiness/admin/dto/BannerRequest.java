package com.happiness.admin.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor
public class BannerRequest {
    private String title;
    private String imageUrl;
    private String linkUrl;
    private boolean isActive;
    private LocalDateTime startsAt;
    private LocalDateTime endsAt;
    // reorder 전용 (id -> displayOrder 매핑)
    private List<Long> orderedIds;
}

package com.happiness.admin.dto;

import com.happiness.admin.entity.FeaturedItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AdminFeaturedDto {
    private Long id;
    private Long photoId;
    private String photoTitle;
    private String thumbnailUrl;
    private String authorName;
    private int likesCount;
    private int displayOrder;
    private LocalDate startsAt;
    private LocalDate endsAt;
    private LocalDateTime addedAt;

    public static AdminFeaturedDto from(FeaturedItem f) {
        return AdminFeaturedDto.builder()
                .id(f.getId())
                .photoId(f.getPhoto().getId())
                .photoTitle(f.getPhoto().getTitle())
                .thumbnailUrl(f.getPhoto().getThumbnailUrl())
                .authorName(f.getPhoto().getMember().getName())
                .likesCount(f.getPhoto().getLikesCount())
                .displayOrder(f.getDisplayOrder())
                .startsAt(f.getStartsAt())
                .endsAt(f.getEndsAt())
                .addedAt(f.getAddedAt())
                .build();
    }
}

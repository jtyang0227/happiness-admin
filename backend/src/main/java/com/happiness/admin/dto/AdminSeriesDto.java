package com.happiness.admin.dto;

import com.happiness.admin.entity.Series;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AdminSeriesDto {
    private Long id;
    private String title;
    private String coverImageUrl;
    private Long memberId;
    private String authorName;
    private int photoCount;
    private int likesCount;
    private int viewCount;
    private String shootType;
    private boolean draft;
    private boolean featured;
    private LocalDateTime featuredAt;
    private LocalDateTime createdAt;

    public static AdminSeriesDto from(Series s, long photoCount) {
        return AdminSeriesDto.builder()
                .id(s.getId())
                .title(s.getTitle())
                .coverImageUrl(s.getCoverImageUrl())
                .memberId(s.getMember().getId())
                .authorName(s.getMember().getName())
                .photoCount((int) photoCount)
                .likesCount(s.getLikesCount())
                .viewCount(s.getViewCount())
                .shootType(s.getShootType())
                .draft(Boolean.TRUE.equals(s.getDraft()))
                .featured(s.getFeaturedAt() != null)
                .featuredAt(s.getFeaturedAt())
                .createdAt(s.getCreatedAt())
                .build();
    }
}

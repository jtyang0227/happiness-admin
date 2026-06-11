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
    private LocalDateTime createdAt;

    public static AdminSeriesDto from(Series s) {
        return AdminSeriesDto.builder()
                .id(s.getId())
                .title(s.getTitle())
                .coverImageUrl(s.getCoverImageUrl())
                .memberId(s.getMember().getId())
                .authorName(s.getMember().getName())
                .photoCount(s.getSeriesPhotos().size())
                .createdAt(s.getCreatedAt())
                .build();
    }
}

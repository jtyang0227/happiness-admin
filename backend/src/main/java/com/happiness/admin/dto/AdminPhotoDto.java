package com.happiness.admin.dto;

import com.happiness.admin.entity.Photo;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AdminPhotoDto {
    private Long id;
    private String title;
    private String imageUrl;
    private String thumbnailUrl;
    private String colorMood;
    private int likesCount;
    private int savesCount;
    private int sharesCount;
    private Long memberId;
    private String authorName;
    private LocalDateTime createdAt;

    public static AdminPhotoDto from(Photo p) {
        return AdminPhotoDto.builder()
                .id(p.getId())
                .title(p.getTitle())
                .imageUrl(p.getImageUrl())
                .thumbnailUrl(p.getThumbnailUrl())
                .colorMood(p.getColorMood())
                .likesCount(p.getLikesCount())
                .savesCount(p.getSavesCount())
                .sharesCount(p.getSharesCount())
                .memberId(p.getMember().getId())
                .authorName(p.getMember().getName())
                .createdAt(p.getCreatedAt())
                .build();
    }
}

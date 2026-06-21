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
    private String categoryCode;
    private String l1Name;
    private String l2Name;
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
                .categoryCode(p.getCategoryCode())
                .l1Name(p.getCategoryCode() != null ? com.happiness.admin.util.CategoryCode.getLevel(p.getCategoryCode(), 1) : "00")
                .l2Name(p.getCategoryCode() != null ? com.happiness.admin.util.CategoryCode.getLevel(p.getCategoryCode(), 2) : "00")
                .createdAt(p.getCreatedAt())
                .build();
    }
}

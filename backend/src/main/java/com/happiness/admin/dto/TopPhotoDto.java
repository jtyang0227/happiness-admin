package com.happiness.admin.dto;

import com.happiness.admin.entity.Photo;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class TopPhotoDto {
    private Long id;
    private String title;
    private String thumbnailUrl;
    private String authorName;
    private int likesCount;
    private int savesCount;
    private int sharesCount;

    public static TopPhotoDto from(Photo p) {
        return TopPhotoDto.builder()
                .id(p.getId())
                .title(p.getTitle())
                .thumbnailUrl(p.getThumbnailUrl())
                .authorName(p.getMember().getName())
                .likesCount(p.getLikesCount())
                .savesCount(p.getSavesCount())
                .sharesCount(p.getSharesCount())
                .build();
    }
}

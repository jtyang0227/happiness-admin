package com.happiness.admin.dto;

import com.happiness.admin.entity.Portfolio;
import com.happiness.admin.util.CategoryCode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AdminPortfolioDto {
    private Long id;
    private String title;
    private String subtitle;
    private String coverImageUrl;
    private Long memberId;
    private String authorName;
    private String authorProfile;
    private String categoryCode;
    private String l1Name;
    private String tags;
    private String status;
    private String visibility;
    private int viewCount;
    private int likesCount;
    private boolean pinned;
    private String adminNote;
    private int photoCount;
    private int seriesCount;
    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;

    public static AdminPortfolioDto from(Portfolio p) {
        String[] codes = CategoryCode.parse(p.getCategoryCode());
        int photos  = (int) p.getItems().stream().filter(i -> "PHOTO".equals(i.getItemType())).count();
        int series  = (int) p.getItems().stream().filter(i -> "SERIES".equals(i.getItemType())).count();
        return AdminPortfolioDto.builder()
                .id(p.getId())
                .title(p.getTitle())
                .subtitle(p.getSubtitle())
                .coverImageUrl(p.getCoverImageUrl())
                .memberId(p.getMember().getId())
                .authorName(p.getMember().getName())
                .authorProfile(p.getMember().getProfileName())
                .categoryCode(p.getCategoryCode())
                .l1Name(codes[0])
                .tags(p.getTags())
                .status(p.getStatus().name())
                .visibility(p.getVisibility().name())
                .viewCount(p.getViewCount())
                .likesCount(p.getLikesCount())
                .pinned(p.isPinned())
                .adminNote(p.getAdminNote())
                .photoCount(photos)
                .seriesCount(series)
                .reviewedAt(p.getReviewedAt())
                .createdAt(p.getCreatedAt())
                .build();
    }
}

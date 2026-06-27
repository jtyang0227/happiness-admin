package com.happiness.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class PhotographerStatDto {
    private Long memberId;
    private String name;
    private String profileName;
    private long photoCount;
    private long totalLikes;
    private long totalSaves;
    private long inquiryCount;
}

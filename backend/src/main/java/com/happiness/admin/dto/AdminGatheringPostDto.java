package com.happiness.admin.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AdminGatheringPostDto {
    private Long id;
    private Long gatheringId;
    private Long memberId;
    private String memberName;
    private String content;
    private String hashtags;
    private List<String> photoUrls;
    private int likeCount;
    private int commentCount;
    private LocalDateTime createdAt;
}

package com.happiness.admin.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

/** 작가 프로필 콘텐츠 5종(후기·가격·언론·수상·브랜드)을 한 표에서 점검하기 위한 공통 모양. */
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ProfileContentDto {
    private Long id;
    private String type;
    private Long memberId;
    private String memberName;
    private String title;
    private String subtitle;
    private String body;
    private String linkUrl;
    private String imageUrl;
    private List<String> tags;
    private LocalDateTime createdAt;
}

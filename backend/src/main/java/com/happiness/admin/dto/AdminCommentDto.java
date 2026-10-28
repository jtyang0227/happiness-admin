package com.happiness.admin.dto;

import com.happiness.admin.entity.Comment;
import lombok.*;

import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AdminCommentDto {
    private Long id;
    private Long photoId;
    private String photoTitle;
    private String photoThumbnailUrl;
    private Long memberId;
    private String memberName;
    private String content;
    private Long parentId;
    private int replyCount;
    private LocalDateTime createdAt;

    public static AdminCommentDto from(Comment c, String photoTitle, String photoThumbnailUrl, long replyCount) {
        return AdminCommentDto.builder()
                .id(c.getId())
                .photoId(c.getPhotoId())
                .photoTitle(photoTitle)
                .photoThumbnailUrl(photoThumbnailUrl)
                .memberId(c.getMemberId())
                .memberName(c.getMemberName())
                .content(c.getContent())
                .parentId(c.getParentId())
                .replyCount((int) replyCount)
                .createdAt(c.getCreatedAt())
                .build();
    }
}

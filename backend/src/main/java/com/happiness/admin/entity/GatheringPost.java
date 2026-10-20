package com.happiness.admin.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** App 모임 피드 게시글 테이블 매핑. 사진·좋아요·댓글은 FK 없이 gathering_post_id로만 연결된다. */
@Entity
@Table(name = "gathering_posts")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class GatheringPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "gathering_id", nullable = false)
    private Long gatheringId;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "member_name", length = 100, nullable = false)
    private String memberName;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(length = 300)
    private String hashtags;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) this.createdAt = LocalDateTime.now();
    }
}

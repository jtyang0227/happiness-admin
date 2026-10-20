package com.happiness.admin.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** App(happiness-app)의 사진 댓글 테이블을 그대로 매핑한다 — 컬럼명·제약은 App 엔티티와 같아야 한다. */
@Entity
@Table(name = "comments", indexes = {
        @Index(name = "idx_comments_photo_id", columnList = "photo_id"),
        @Index(name = "idx_comments_parent_id", columnList = "parent_id")
})
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "photo_id", nullable = false)
    private Long photoId;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "member_name", nullable = false, length = 100)
    private String memberName;

    @Column(name = "member_avatar_url", length = 500)
    private String memberAvatarUrl;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "parent_id")
    private Long parentId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) this.createdAt = LocalDateTime.now();
    }
}

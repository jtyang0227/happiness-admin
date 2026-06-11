package com.happiness.admin.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "photos")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Photo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "thumbnail_url")
    private String thumbnailUrl;

    @Column(name = "color_mood")
    private String colorMood;

    @Column(name = "likes_count", nullable = false)
    @Builder.Default
    private int likesCount = 0;

    @Column(name = "saves_count", nullable = false)
    @Builder.Default
    private int savesCount = 0;

    @Column(name = "shares_count", nullable = false)
    @Builder.Default
    private int sharesCount = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) this.createdAt = LocalDateTime.now();
        if (this.updatedAt == null) this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}

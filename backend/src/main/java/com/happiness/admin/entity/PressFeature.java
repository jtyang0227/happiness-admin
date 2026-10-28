package com.happiness.admin.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** App(happiness-app) 작가 프로필 콘텐츠 테이블 매핑 — 작가가 App에서 관리하고 Admin은 점검·삭제만 한다. */
@Entity
@Table(name = "press_features")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class PressFeature {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "publication", nullable = false, length = 100)
    private String publication;

    @Column(name = "title", length = 200)
    private String title;

    @Column(name = "url", length = 500)
    private String url;

    @Column(name = "published_date", length = 20)
    private String publishedDate;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private int displayOrder = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) this.createdAt = LocalDateTime.now();
    }
}

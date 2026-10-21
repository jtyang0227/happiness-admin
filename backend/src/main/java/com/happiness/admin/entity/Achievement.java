package com.happiness.admin.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** App(happiness-app) 작가 프로필 콘텐츠 테이블 매핑 — 작가가 App에서 관리하고 Admin은 점검·삭제만 한다. */
@Entity
@Table(name = "achievements")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Achievement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    /** AWARD | EXHIBITION | PUBLICATION */
    @Column(name = "type", nullable = false, length = 20)
    private String type;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "organizer", length = 100)
    private String organizer;

    @Column(name = "location", length = 100)
    private String location;

    @Column(name = "year_month", length = 7)
    private String yearMonth;

    @Column(name = "url", length = 500)
    private String url;

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

package com.happiness.admin.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * App(happiness-app)의 모임 테이블 부분 매핑 — 운영 화면에 필요한 컬럼만 둔다.
 * status: RECRUITING | RECRUITMENT_CLOSED | SCHEDULED | ONGOING | ENDED (App 배치가 자동 전환)
 */
@Entity
@Table(name = "gatherings")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Gathering {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 200, nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 300, nullable = false)
    private String location;

    @Column(name = "start_date_time", nullable = false)
    private LocalDateTime startDateTime;

    @Column(name = "end_date_time", nullable = false)
    private LocalDateTime endDateTime;

    @Column(name = "max_participants", nullable = false)
    private Integer maxParticipants;

    @Column(name = "recruitment_end_date_time", nullable = false)
    private LocalDateTime recruitmentEndDateTime;

    @Column(length = 20, nullable = false)
    private String status;

    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    @Column(name = "shoot_theme", length = 200)
    private String shootTheme;

    @Column(name = "created_by", nullable = false)
    private Long createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) this.createdAt = LocalDateTime.now();
    }
}

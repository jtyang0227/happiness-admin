package com.happiness.admin.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** App(happiness-app) 작가 프로필 콘텐츠 테이블 매핑 — 작가가 App에서 관리하고 Admin은 점검·삭제만 한다. */
@Entity
@Table(name = "pricing_packages")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class PricingPackage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "price")
    private Integer price;

    @Column(name = "price_label", length = 50)
    private String priceLabel;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "features", columnDefinition = "TEXT")
    private String features;

    @Column(nullable = false)
    private boolean featured;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

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

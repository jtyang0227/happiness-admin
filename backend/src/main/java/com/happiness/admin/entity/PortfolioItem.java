package com.happiness.admin.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "portfolio_items")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class PortfolioItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "portfolio_id", nullable = false)
    @ToString.Exclude @EqualsAndHashCode.Exclude
    private Portfolio portfolio;

    @Column(name = "item_type", length = 10, nullable = false)
    private String itemType; // "PHOTO" or "SERIES"

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "photo_id")
    @ToString.Exclude @EqualsAndHashCode.Exclude
    private Photo photo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "series_id")
    @ToString.Exclude @EqualsAndHashCode.Exclude
    private Series series;

    @Column(name = "display_order")
    @Builder.Default
    private int displayOrder = 0;

    @Column(name = "section_name", length = 50)
    private String sectionName;

    @Column(name = "is_featured")
    @Builder.Default
    private boolean featured = false;
}

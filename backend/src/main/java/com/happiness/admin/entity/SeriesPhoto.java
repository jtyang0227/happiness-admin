package com.happiness.admin.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "series_photos")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class SeriesPhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "series_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Series series;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "photo_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Photo photo;

    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private int displayOrder = 0;
}

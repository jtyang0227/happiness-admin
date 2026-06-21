package com.happiness.admin.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "photo_categories",
       uniqueConstraints = @UniqueConstraint(columnNames = {"level", "code"}))
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class PhotoCategory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private int level;
    @Column(nullable = false, length = 2)
    private String code;
    @Column(name = "name_ko", nullable = false, length = 20)
    private String nameKo;
    @Column(name = "name_en", length = 20)
    private String nameEn;
    @Column(name = "sort_order")
    private int sortOrder;
    @Column(name = "is_active")
    @Builder.Default
    private boolean active = true;
}

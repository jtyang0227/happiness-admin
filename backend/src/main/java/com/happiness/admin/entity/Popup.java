package com.happiness.admin.entity;

import lombok.*;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "popups")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Popup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(nullable = true, length = 500)
    private String imageUrl;

    @Column(nullable = true, length = 500)
    private String linkUrl;

    // ALL / HOME / FEED
    @Column(nullable = false, length = 20)
    private String targetScreen;

    @Column(nullable = false)
    private boolean isActive;

    // true = 앱에서 "오늘 하루 보지 않기" 버튼 표시
    @Column(nullable = false)
    private boolean showOnce;

    @Column(nullable = false)
    private int displayOrder;

    @Column(nullable = true)
    private LocalDateTime startsAt;

    @Column(nullable = true)
    private LocalDateTime endsAt;

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

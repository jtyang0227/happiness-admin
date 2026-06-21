package com.happiness.admin.entity;

import lombok.*;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reports")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = true)
    private Member reporter;

    @Column(nullable = false, length = 20)
    private String targetType; // PHOTO/MEMBER/SERIES

    @Column(nullable = false)
    private Long targetId;

    @Column(nullable = false, length = 100)
    private String reason; // 부적절 콘텐츠/스팸/저작권 등

    @Column(nullable = true, length = 500)
    private String details;

    @Column(nullable = false, length = 20)
    private String status; // PENDING/IN_REVIEW/ACTION_TAKEN/DISMISSED

    @Column(nullable = true, length = 500)
    private String processMemo;

    @Column(nullable = true)
    private Long processedById;

    @Column(nullable = true)
    private LocalDateTime processedAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) this.createdAt = LocalDateTime.now();
        if (this.status == null) this.status = "PENDING";
    }
}

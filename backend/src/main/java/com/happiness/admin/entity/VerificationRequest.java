package com.happiness.admin.entity;

import lombok.*;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "verification_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerificationRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @Column(nullable = true, length = 500)
    private String portfolioUrl;

    @Column(nullable = true, length = 500)
    private String bio;

    @Column(nullable = false, length = 20)
    private String status; // PENDING/APPROVED/REJECTED

    @Column(nullable = true, length = 500)
    private String rejectReason;

    @Column(nullable = true)
    private Long reviewedById;

    @Column(nullable = true)
    private LocalDateTime reviewedAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) this.createdAt = LocalDateTime.now();
        if (this.status == null) this.status = "PENDING";
    }
}

package com.happiness.admin.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * App 납품(사진 전달) 세트의 메타데이터만 매핑한다 — 접근 토큰·비밀번호 해시·고객 피드백·사진은 매핑하지 않는다.
 * status: PENDING | APPROVED | REJECTED
 */
@Entity
@Table(name = "delivery_sets")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class DeliverySet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(length = 200, nullable = false)
    private String title;

    @Column(name = "client_name", length = 100)
    private String clientName;

    @Column(length = 20)
    private String status;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "viewed_at")
    private LocalDateTime viewedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}

package com.happiness.admin.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * App 미팅(작가↔고객) 테이블의 메타데이터만 매핑한다 — 메시지·첫 문의 본문·주소·좌표는 개인 간 거래 정보라
 * 의도적으로 매핑하지 않는다(WORK_QUEUE 원칙). status: PENDING | NEGOTIATING | CONFIRMED | CANCELLED | COMPLETED
 */
@Entity
@Table(name = "meets")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Meet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "requester_id", nullable = false)
    private Long requesterId;

    @Column(name = "receiver_id", nullable = false)
    private Long receiverId;

    @Column(length = 20, nullable = false)
    private String status;

    @Column(name = "confirmed_date")
    private LocalDate confirmedDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}

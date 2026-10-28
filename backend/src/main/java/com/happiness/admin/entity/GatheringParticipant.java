package com.happiness.admin.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** App 모임 참여자 테이블 매핑. status: PARTICIPATING | WAITING | NOT_PARTICIPATING | CANCELLED */
@Entity
@Table(name = "gathering_participants")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class GatheringParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "gathering_id", nullable = false)
    private Long gatheringId;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(length = 20, nullable = false)
    private String status;

    @Column(name = "joined_at", nullable = false, updatable = false)
    private LocalDateTime joinedAt;

    @PrePersist
    protected void onCreate() {
        if (this.joinedAt == null) this.joinedAt = LocalDateTime.now();
    }
}

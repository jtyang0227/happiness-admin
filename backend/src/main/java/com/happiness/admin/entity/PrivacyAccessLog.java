package com.happiness.admin.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 개인정보 접속기록(안전성 확보조치 기준 제8조) — 계정·접속일시·접속지·처리한 정보주체·수행업무를 남긴다.
 * 위·변조 방지를 위해 각 행이 직전 행의 해시를 포함하는 해시 체인으로 저장되며, 수정·삭제 API는 두지 않는다.
 */
@Entity
@Table(name = "admin_privacy_access_logs", indexes = {
        @Index(name = "idx_privacy_logs_accessed_at", columnList = "accessed_at"),
        @Index(name = "idx_privacy_logs_subject", columnList = "subject_member_id")
})
@Getter @NoArgsConstructor @AllArgsConstructor @Builder
public class PrivacyAccessLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "admin_id")
    private Long adminId;

    @Column(name = "admin_name", length = 100)
    private String adminName;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    /** LIST | VIEW | REVEAL | EXPORT | INSPECTION */
    @Column(nullable = false, length = 20)
    private String action;

    @Column(name = "subject_member_id")
    private Long subjectMemberId;

    @Column(name = "subject_count")
    private Integer subjectCount;

    @Column(length = 300)
    private String reason;

    @Column(length = 500)
    private String detail;

    @Column(name = "accessed_at", nullable = false, updatable = false)
    private LocalDateTime accessedAt;

    @Column(name = "prev_hash", length = 64)
    private String prevHash;

    @Column(nullable = false, length = 64)
    private String hash;
}

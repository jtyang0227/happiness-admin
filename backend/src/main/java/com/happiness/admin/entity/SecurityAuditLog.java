package com.happiness.admin.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * App(happiness-app)의 보안 감사 로그 테이블 매핑 — App이 쓰고 Admin은 읽기만 한다.
 * action_type: LOGIN_FAILURE | LOGIN_SUCCESS | ADMIN_API | SERVICE
 */
@Entity
@Table(name = "security_audit_log", indexes = @Index(name = "idx_audit_member", columnList = "member_id"))
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class SecurityAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "member_id")
    private Long memberId;

    @Column(name = "action_type", nullable = false, length = 100)
    private String actionType;

    @Column(name = "action_detail", length = 500)
    private String actionDetail;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "role", length = 10)
    private String role;

    @Column(nullable = false)
    private Boolean success;

    @Column(name = "error_message", length = 500)
    private String errorMessage;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) this.createdAt = LocalDateTime.now();
    }
}

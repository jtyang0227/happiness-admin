package com.happiness.admin.entity;

import jakarta.persistence.*;
import com.happiness.admin.privacy.EncryptedStringConverter;
import lombok.*;

import java.time.LocalDateTime;

/** 운영자 간 인수인계용 내부 메모 — Admin 전용 테이블(App은 읽지 않는다), 회원에게 노출되지 않는다. */
@Entity
@Table(name = "admin_member_notes", indexes = @Index(name = "idx_admin_member_notes_member", columnList = "member_id"))
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AdminMemberNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "admin_id")
    private Long adminId;

    @Column(name = "admin_name", length = 100)
    private String adminName;

    @Column(nullable = false, columnDefinition = "TEXT")
    @Convert(converter = EncryptedStringConverter.class)
    private String content;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) this.createdAt = LocalDateTime.now();
    }
}

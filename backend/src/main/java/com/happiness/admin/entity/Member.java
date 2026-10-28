package com.happiness.admin.entity;

import com.happiness.admin.privacy.EncryptedStringConverter;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "members")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Member {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = true, unique = true)
    private String profileName;
    
    @Column(nullable = false)
    private String tel;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = true)
    private String password;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private MemberStatus status;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Authority authority;
    
    @Column(nullable = true)
    private String provider;

    @Column(nullable = true)
    private String providerId;

    /** Admin 전용 컬럼(App 엔티티에 없음) — AES-GCM 암호화 저장. 평문 100자 상한이면 암호문이 500자 안에 들어간다. */
    @Column(nullable = true, length = 500)
    @Convert(converter = EncryptedStringConverter.class)
    private String suspendReason;

    @Column(nullable = true)
    private LocalDateTime suspendUntil;

    @Column(nullable = true)
    private Long suspendedById;

    @Column(nullable = true)
    private LocalDateTime suspendedAt;

    @Builder.Default
    @Column(nullable = false)
    private boolean isVerified = false;

    @Column(nullable = true)
    private LocalDateTime verifiedAt;

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

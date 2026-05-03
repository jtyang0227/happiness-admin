package com.happiness.admin.entity;

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
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}

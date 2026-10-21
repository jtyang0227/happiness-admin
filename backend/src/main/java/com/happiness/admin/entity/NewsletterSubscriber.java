package com.happiness.admin.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** App 뉴스레터 구독자 테이블 매핑. token은 수신거부 링크용 비밀값이라 어떤 응답에도 내보내지 않는다. */
@Entity
@Table(name = "newsletter_subscribers")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class NewsletterSubscriber {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(nullable = false, length = 255)
    private String email;

    @Column(nullable = false, unique = true, length = 64)
    @ToString.Exclude
    private String token;

    @Column(name = "subscribed_at", nullable = false, updatable = false)
    private LocalDateTime subscribedAt;

    @Column(name = "unsubscribed_at")
    private LocalDateTime unsubscribedAt;

    @PrePersist
    protected void onCreate() {
        if (this.subscribedAt == null) this.subscribedAt = LocalDateTime.now();
    }
}

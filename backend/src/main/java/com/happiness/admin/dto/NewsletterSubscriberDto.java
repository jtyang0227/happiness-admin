package com.happiness.admin.dto;

import com.happiness.admin.entity.NewsletterSubscriber;
import lombok.*;

import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class NewsletterSubscriberDto {
    private Long id;
    private Long memberId;
    private String memberName;
    private String email;
    private boolean active;
    private LocalDateTime subscribedAt;
    private LocalDateTime unsubscribedAt;

    public static NewsletterSubscriberDto from(NewsletterSubscriber s, String memberName) {
        return NewsletterSubscriberDto.builder()
                .id(s.getId())
                .memberId(s.getMemberId())
                .memberName(memberName)
                .email(s.getEmail())
                .active(s.getUnsubscribedAt() == null)
                .subscribedAt(s.getSubscribedAt())
                .unsubscribedAt(s.getUnsubscribedAt())
                .build();
    }
}

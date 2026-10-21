package com.happiness.admin.service;

import com.happiness.admin.dto.NewsletterSubscriberDto;
import com.happiness.admin.dto.PageResponse;
import com.happiness.admin.entity.Member;
import com.happiness.admin.entity.NewsletterSubscriber;
import com.happiness.admin.repository.MemberRepository;
import com.happiness.admin.repository.NewsletterSubscriberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminNewsletterService {

    private final NewsletterSubscriberRepository subscriberRepository;
    private final MemberRepository memberRepository;
    private final AdminActivityRecorder activityRecorder;
    private final com.happiness.admin.privacy.PrivacyAccessRecorder privacyAccessRecorder;

    public PageResponse<NewsletterSubscriberDto> getSubscribers(Boolean active, String search, int page, int size) {
        String searchTerm = (search != null && !search.isBlank()) ? search.trim() : null;
        var pageable = PageRequest.of(page, size, Sort.by("subscribedAt").descending().and(Sort.by("id").descending()));
        var subscribers = subscriberRepository.search(active, searchTerm, pageable);
        Map<Long, String> names = memberNames(subscribers.getContent());
        return PageResponse.of(subscribers.map(s -> NewsletterSubscriberDto.from(s, names.get(s.getMemberId()))));
    }

    public Map<String, Long> getCounts() {
        LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);
        Map<String, Long> counts = new LinkedHashMap<>();
        counts.put("active", subscriberRepository.countByUnsubscribedAtIsNull());
        counts.put("unsubscribed", subscriberRepository.countByUnsubscribedAtIsNotNull());
        counts.put("new7d", subscriberRepository.countBySubscribedAtGreaterThanEqualAndUnsubscribedAtIsNull(weekAgo));
        counts.put("unsubscribed7d", subscriberRepository.countByUnsubscribedAtGreaterThanEqual(weekAgo));
        return counts;
    }

    /** 활성 구독자 전체(발송 도구로 옮기기용). 개인정보 반출이라 활동 로그를 남긴다. */
    @Transactional
    public List<Map<String, Object>> exportActive(String reason) {
        String why = com.happiness.admin.privacy.PrivacyAccessRecorder.requireReason(reason);
        List<NewsletterSubscriber> active = subscriberRepository.findByUnsubscribedAtIsNullOrderBySubscribedAtAsc();
        Map<Long, String> names = memberNames(active);
        activityRecorder.record("NEWSLETTER_EXPORT", "NEWSLETTER", null, "활성 구독자 " + active.size() + "명 CSV 내보내기");
        privacyAccessRecorder.record("EXPORT", null, active.size(), why, "뉴스레터 활성 구독자 CSV (이메일)");
        return active.stream().map(s -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("email", s.getEmail());
            row.put("memberName", names.get(s.getMemberId()));
            row.put("subscribedAt", s.getSubscribedAt());
            return row;
        }).toList();
    }

    private Map<Long, String> memberNames(List<NewsletterSubscriber> subscribers) {
        List<Long> ids = subscribers.stream().map(NewsletterSubscriber::getMemberId).distinct().toList();
        if (ids.isEmpty()) return Map.of();
        return memberRepository.findAllById(ids).stream().collect(Collectors.toMap(Member::getId, Member::getName));
    }
}

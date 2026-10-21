package com.happiness.admin.service;

import com.happiness.admin.dto.PageResponse;
import com.happiness.admin.entity.DeliverySet;
import com.happiness.admin.entity.Meet;
import com.happiness.admin.entity.Member;
import com.happiness.admin.repository.DeliverySetRepository;
import com.happiness.admin.repository.MeetRepository;
import com.happiness.admin.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * 미팅·납품 운영 현황 — 읽기 전용, 메타데이터만. 정체 건을 찾아 작가에게 안내할 수 있게 하는 것이 목적이고,
 * 거래 내용 자체(메시지·사진·피드백)는 다루지 않는다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminTransactionService {

    static final int MEET_STALL_DAYS = 7;
    static final int DELIVERY_EXPIRY_WARN_DAYS = 3;

    private final MeetRepository meetRepository;
    private final DeliverySetRepository deliveryRepository;
    private final MemberRepository memberRepository;

    public Map<String, Object> getSummary() {
        LocalDateTime now = LocalDateTime.now();
        List<Meet> stalledMeets = meetRepository.findStalled(now.minusDays(MEET_STALL_DAYS), PageRequest.of(0, 10));
        List<DeliverySet> expiring = deliveryRepository.findExpiringPending(now.plusDays(DELIVERY_EXPIRY_WARN_DAYS), PageRequest.of(0, 10));
        Map<Long, String> names = names(Stream.concat(
                stalledMeets.stream().flatMap(m -> Stream.of(m.getRequesterId(), m.getReceiverId())),
                expiring.stream().map(DeliverySet::getMemberId)).toList());

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("meetCounts", toStatusMap(meetRepository.countByStatus()));
        summary.put("deliveryCounts", toStatusMap(deliveryRepository.countByStatus()));
        summary.put("meetStallDays", MEET_STALL_DAYS);
        summary.put("deliveryExpiryWarnDays", DELIVERY_EXPIRY_WARN_DAYS);
        summary.put("stalledMeets", stalledMeets.stream().map(m -> meetRow(m, names)).toList());
        summary.put("expiringDeliveries", expiring.stream().map(d -> deliveryRow(d, names, now)).toList());
        return summary;
    }

    public PageResponse<Map<String, Object>> getMeets(String status, int page, int size) {
        var meets = meetRepository.findByStatusOrAll(blankToNull(status),
                PageRequest.of(page, size, Sort.by("updatedAt").descending().and(Sort.by("id").descending())));
        Map<Long, String> names = names(meets.getContent().stream()
                .flatMap(m -> Stream.of(m.getRequesterId(), m.getReceiverId())).toList());
        return PageResponse.of(meets.map(m -> meetRow(m, names)));
    }

    public PageResponse<Map<String, Object>> getDeliveries(String status, int page, int size) {
        LocalDateTime now = LocalDateTime.now();
        var deliveries = deliveryRepository.findByStatusOrAll(blankToNull(status),
                PageRequest.of(page, size, Sort.by("createdAt").descending().and(Sort.by("id").descending())));
        Map<Long, String> names = names(deliveries.getContent().stream().map(DeliverySet::getMemberId).toList());
        return PageResponse.of(deliveries.map(d -> deliveryRow(d, names, now)));
    }

    private Map<String, Object> meetRow(Meet m, Map<Long, String> names) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", m.getId());
        row.put("requesterId", m.getRequesterId());
        row.put("requesterName", names.get(m.getRequesterId()));
        row.put("receiverId", m.getReceiverId());
        row.put("receiverName", names.get(m.getReceiverId()));
        row.put("status", m.getStatus());
        row.put("confirmedDate", m.getConfirmedDate());
        row.put("createdAt", m.getCreatedAt());
        row.put("updatedAt", m.getUpdatedAt());
        return row;
    }

    private Map<String, Object> deliveryRow(DeliverySet d, Map<Long, String> names, LocalDateTime now) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", d.getId());
        row.put("memberId", d.getMemberId());
        row.put("memberName", names.get(d.getMemberId()));
        row.put("title", d.getTitle());
        row.put("clientName", d.getClientName());
        row.put("status", d.getStatus() == null ? "PENDING" : d.getStatus());
        row.put("expiresAt", d.getExpiresAt());
        row.put("expired", d.getExpiresAt().isBefore(now));
        row.put("viewed", d.getViewedAt() != null);
        row.put("approvedAt", d.getApprovedAt());
        row.put("createdAt", d.getCreatedAt());
        return row;
    }

    private Map<Long, String> names(List<Long> ids) {
        List<Long> distinct = ids.stream().filter(Objects::nonNull).distinct().toList();
        if (distinct.isEmpty()) return new HashMap<>();
        return memberRepository.findAllById(distinct).stream().collect(Collectors.toMap(Member::getId, Member::getName));
    }

    private static Map<String, Long> toStatusMap(List<Object[]> rows) {
        Map<String, Long> map = new LinkedHashMap<>();
        for (Object[] r : rows) map.put(r[0] == null ? "PENDING" : (String) r[0], (Long) r[1]);
        return map;
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }
}

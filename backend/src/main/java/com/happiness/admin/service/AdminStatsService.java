package com.happiness.admin.service;

import com.happiness.admin.dto.DailyStatDto;
import com.happiness.admin.dto.DistItemDto;
import com.happiness.admin.dto.PhotographerStatDto;
import com.happiness.admin.dto.StatsSummaryDto;
import com.happiness.admin.dto.TopPhotoDto;
import com.happiness.admin.entity.BookingStatus;
import com.happiness.admin.repository.BookingRepository;
import com.happiness.admin.repository.InquiryRepository;
import com.happiness.admin.repository.MemberRepository;
import com.happiness.admin.repository.PhotoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminStatsService {

    private final MemberRepository memberRepository;
    private final PhotoRepository photoRepository;
    private final InquiryRepository inquiryRepository;
    private final BookingRepository bookingRepository;

    public StatsSummaryDto getSummary() {
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime todayEnd = todayStart.plusDays(1);
        return StatsSummaryDto.builder()
                .totalMembers(memberRepository.count())
                .totalPhotos(photoRepository.count())
                .todayInquiries(inquiryRepository.countToday(todayStart, todayEnd))
                .unreadInquiries(inquiryRepository.countByIsReadFalse())
                .todayBookings(bookingRepository.countTodayConfirmed(LocalDate.now()))
                .pendingBookings(bookingRepository.countByStatus(BookingStatus.REQUESTED))
                .build();
    }

    public List<DailyStatDto> getDaily(int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        Map<String, Long> photoMap = toMap(photoRepository.dailyUploads(since));
        Map<String, Long> signupMap = toMap(memberRepository.dailySignups(since));
        Map<String, Long> inquiryMap = toMap(inquiryRepository.dailyInquiries(since));

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        List<DailyStatDto> result = new ArrayList<>();
        for (int i = days - 1; i >= 0; i--) {
            String day = LocalDate.now().minusDays(i).format(fmt);
            result.add(DailyStatDto.builder()
                    .day(day)
                    .photos(photoMap.getOrDefault(day, 0L))
                    .signups(signupMap.getOrDefault(day, 0L))
                    .inquiries(inquiryMap.getOrDefault(day, 0L))
                    .build());
        }
        return result;
    }

    public List<TopPhotoDto> getTopPhotos(String sortBy) {
        List<com.happiness.admin.entity.Photo> photos = switch (sortBy) {
            case "saves"  -> photoRepository.findTopBySaves(PageRequest.of(0, 10));
            case "shares" -> photoRepository.findTopByShares(PageRequest.of(0, 10));
            default       -> photoRepository.findTopByLikes(PageRequest.of(0, 10));
        };
        return photos.stream().map(TopPhotoDto::from).collect(Collectors.toList());
    }

    public List<DistItemDto> getMoodDistribution() {
        return photoRepository.moodDistribution().stream()
                .map(r -> new DistItemDto((String) r[0], (Long) r[1]))
                .collect(Collectors.toList());
    }

    public List<DistItemDto> getShootTypeDistribution() {
        return inquiryRepository.shootTypeDistribution().stream()
                .map(r -> new DistItemDto((String) r[0], (Long) r[1]))
                .collect(Collectors.toList());
    }

    public List<PhotographerStatDto> getPhotographerStats(int limit) {
        return memberRepository.photographerStats(PageRequest.of(0, limit)).stream()
                .map(r -> PhotographerStatDto.builder()
                        .memberId((Long) r[0])
                        .name((String) r[1])
                        .profileName((String) r[2])
                        .photoCount((Long) r[3])
                        .totalLikes((Long) r[4])
                        .totalSaves((Long) r[5])
                        .build())
                .collect(Collectors.toList());
    }

    private Map<String, Long> toMap(List<Object[]> rows) {
        Map<String, Long> map = new HashMap<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        for (Object[] row : rows) {
            String day = ((LocalDate) row[0]).format(fmt);
            map.put(day, (Long) row[1]);
        }
        return map;
    }
}

package com.happiness.admin.service;

import com.happiness.admin.dto.AdminBookingDto;
import com.happiness.admin.dto.BookingCalendarDotDto;
import com.happiness.admin.entity.BookingStatus;
import com.happiness.admin.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminBookingService {

    private final BookingRepository bookingRepository;

    public long countTodayConfirmed() {
        return bookingRepository.countTodayConfirmed(LocalDate.now());
    }

    public long countPendingRequested() {
        return bookingRepository.countByStatus(BookingStatus.REQUESTED);
    }

    public List<BookingCalendarDotDto> getCalendarDots(int year, int month) {
        return bookingRepository.countByDay(year, month).stream()
                .map(r -> new BookingCalendarDotDto((LocalDate) r[0], (Long) r[1]))
                .toList();
    }

    public List<AdminBookingDto> getThisWeek() {
        LocalDate today = LocalDate.now();
        return bookingRepository.findByShootDateBetween(today, today.plusDays(6))
                .stream().map(AdminBookingDto::from).toList();
    }

    public List<AdminBookingDto> getByDate(LocalDate date) {
        return bookingRepository.findByShootDate(date)
                .stream().map(AdminBookingDto::from).toList();
    }

    public Page<AdminBookingDto> getList(LocalDate date, String status, Pageable pageable) {
        BookingStatus statusEnum = (status != null && !status.isBlank())
                ? BookingStatus.valueOf(status) : null;
        return bookingRepository.findWithFilters(date, statusEnum, pageable)
                .map(AdminBookingDto::from);
    }
}

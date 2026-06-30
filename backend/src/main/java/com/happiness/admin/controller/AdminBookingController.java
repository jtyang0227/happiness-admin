package com.happiness.admin.controller;

import com.happiness.admin.service.AdminBookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/bookings")
@RequiredArgsConstructor
public class AdminBookingController {

    private final AdminBookingService bookingService;

    @GetMapping("/calendar")
    public ResponseEntity<?> calendar(
            @RequestParam int year,
            @RequestParam int month) {
        return ResponseEntity.ok(bookingService.getCalendarDots(year, month));
    }

    @GetMapping("/this-week")
    public ResponseEntity<?> thisWeek() {
        return ResponseEntity.ok(bookingService.getThisWeek());
    }

    @GetMapping
    public ResponseEntity<?> list(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(bookingService.getList(date, status, PageRequest.of(page, size)));
    }

    @GetMapping("/by-date")
    public ResponseEntity<?> byDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(bookingService.getByDate(date));
    }
}

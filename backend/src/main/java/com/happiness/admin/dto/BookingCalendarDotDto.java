package com.happiness.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;

@Data @AllArgsConstructor
public class BookingCalendarDotDto {
    private LocalDate date;
    private long count;
}

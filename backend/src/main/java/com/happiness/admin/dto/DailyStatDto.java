package com.happiness.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class DailyStatDto {
    private String day;
    private long photos;
    private long signups;
    private long inquiries;
}

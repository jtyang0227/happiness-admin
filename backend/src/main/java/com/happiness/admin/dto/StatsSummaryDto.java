package com.happiness.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class StatsSummaryDto {
    private long totalMembers;
    private long totalPhotos;
    private long todayInquiries;
    private long unreadInquiries;
    private long todayBookings;
    private long pendingBookings;
}

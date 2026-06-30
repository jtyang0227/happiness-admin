package com.happiness.admin.dto;

import com.happiness.admin.entity.Booking;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AdminBookingDto {
    private Long id;
    private Long photographerId;
    private String photographerName;
    private String photographerProfileName;
    private Long clientId;
    private String clientName;
    private String shootType;
    private LocalDate shootDate;
    private String shootLocation;
    private String budget;
    private String message;
    private String status;
    private String rejectedReason;
    private LocalDateTime createdAt;

    public static AdminBookingDto from(Booking b) {
        return AdminBookingDto.builder()
                .id(b.getId())
                .photographerId(b.getPhotographer() != null ? b.getPhotographer().getId() : null)
                .photographerName(b.getPhotographer() != null ? b.getPhotographer().getName() : null)
                .photographerProfileName(b.getPhotographer() != null ? b.getPhotographer().getProfileName() : null)
                .clientId(b.getClient() != null ? b.getClient().getId() : null)
                .clientName(b.getClientName())
                .shootType(b.getShootType())
                .shootDate(b.getShootDate())
                .shootLocation(b.getShootLocation())
                .budget(b.getBudget())
                .message(b.getMessage())
                .status(b.getStatus().name())
                .rejectedReason(b.getRejectedReason())
                .createdAt(b.getCreatedAt())
                .build();
    }
}

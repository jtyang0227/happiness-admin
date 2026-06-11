package com.happiness.admin.dto;

import com.happiness.admin.entity.Inquiry;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AdminInquiryDto {
    private Long id;
    private String senderName;
    private String senderEmail;
    private String receiverProfileName;
    private String shootType;
    private LocalDate shootDate;
    private String budget;
    private String message;
    private boolean isRead;
    private LocalDateTime createdAt;

    public static AdminInquiryDto from(Inquiry i) {
        return AdminInquiryDto.builder()
                .id(i.getId())
                .senderName(i.getSenderName())
                .senderEmail(i.getSenderEmail())
                .receiverProfileName(i.getReceiver() != null ? i.getReceiver().getProfileName() : null)
                .shootType(i.getShootType())
                .shootDate(i.getShootDate())
                .budget(i.getBudget())
                .message(i.getMessage())
                .isRead(i.isRead())
                .createdAt(i.getCreatedAt())
                .build();
    }
}

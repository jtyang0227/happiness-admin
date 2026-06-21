package com.happiness.admin.dto;

import com.happiness.admin.entity.Report;
import lombok.*;

import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AdminReportDto {
    private Long id;
    private Long reporterId;
    private String reporterName;
    private String reporterEmail;
    private String targetType;
    private Long targetId;
    private String reason;
    private String details;
    private String status;
    private String processMemo;
    private LocalDateTime processedAt;
    private LocalDateTime createdAt;

    public static AdminReportDto from(Report r) {
        return AdminReportDto.builder()
                .id(r.getId())
                .reporterId(r.getReporter() != null ? r.getReporter().getId() : null)
                .reporterName(r.getReporter() != null ? r.getReporter().getName() : null)
                .reporterEmail(r.getReporter() != null ? r.getReporter().getEmail() : null)
                .targetType(r.getTargetType())
                .targetId(r.getTargetId())
                .reason(r.getReason())
                .details(r.getDetails())
                .status(r.getStatus())
                .processMemo(r.getProcessMemo())
                .processedAt(r.getProcessedAt())
                .createdAt(r.getCreatedAt())
                .build();
    }
}

package com.happiness.admin.dto;

import com.happiness.admin.entity.AdminActivityLog;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AdminActivityLogDto {
    private Long id;
    private Long adminId;
    private String adminName;
    private String action;
    private String targetType;
    private Long targetId;
    private String details;
    private LocalDateTime createdAt;

    public static AdminActivityLogDto from(AdminActivityLog log) {
        return AdminActivityLogDto.builder()
                .id(log.getId())
                .adminId(log.getAdminId())
                .adminName(log.getAdminName())
                .action(log.getAction())
                .targetType(log.getTargetType())
                .targetId(log.getTargetId())
                .details(log.getDetails())
                .createdAt(log.getCreatedAt())
                .build();
    }
}

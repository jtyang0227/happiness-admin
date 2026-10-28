package com.happiness.admin.dto;

import com.happiness.admin.entity.SecurityAuditLog;
import lombok.*;

import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class SecurityAuditLogDto {
    private Long id;
    private Long memberId;
    private String memberName;
    private String actionType;
    private String actionDetail;
    private String ipAddress;
    private String role;
    private boolean success;
    private String errorMessage;
    private LocalDateTime createdAt;

    public static SecurityAuditLogDto from(SecurityAuditLog l, String memberName) {
        return SecurityAuditLogDto.builder()
                .id(l.getId())
                .memberId(l.getMemberId())
                .memberName(memberName)
                .actionType(l.getActionType())
                .actionDetail(l.getActionDetail())
                .ipAddress(l.getIpAddress())
                .role(l.getRole())
                .success(Boolean.TRUE.equals(l.getSuccess()))
                .errorMessage(l.getErrorMessage())
                .createdAt(l.getCreatedAt())
                .build();
    }
}

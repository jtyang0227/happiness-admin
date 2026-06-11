package com.happiness.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class SystemStatusDto {
    private boolean mailConfigured;
    private String mailHost;
    private String mailUsername;
    private String rateLimitCapacity;
    private String rateLimitRefillTokens;
    private String rateLimitRefillSeconds;
    private String dbType;
    private String activeProfile;
}

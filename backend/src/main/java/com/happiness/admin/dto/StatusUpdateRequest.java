package com.happiness.admin.dto;

import lombok.Data;

@Data
public class StatusUpdateRequest {
    private String status;
    private String reason;
    private Integer suspendDays;
}

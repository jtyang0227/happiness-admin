package com.happiness.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor
public class StatusUpdateRequest {
    private String status;
    private String reason;
    private Integer suspendDays;
}

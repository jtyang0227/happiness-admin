package com.happiness.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor
public class StatusUpdateRequest {
    private String status; // ACTIVE, SUSPENDED, INACTIVE
    private String reason;
}

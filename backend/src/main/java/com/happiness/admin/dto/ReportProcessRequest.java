package com.happiness.admin.dto;

import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor
public class ReportProcessRequest {
    private String action; // DISMISS / HIDE_CONTENT / DELETE_CONTENT / WARN_AUTHOR / SUSPEND_AUTHOR
    private String memo;
}

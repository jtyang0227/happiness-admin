package com.happiness.admin.dto;

import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AiTriageRunResultDto {
    private int requested;
    private int succeeded;
    private int failed;
}

package com.happiness.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class LoginResponse {
    private String token;
    private Long memberId;
    private String email;
    private String name;
    private String profileName;
    private String authority;
}

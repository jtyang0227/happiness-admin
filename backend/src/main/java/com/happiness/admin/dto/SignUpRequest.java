package com.happiness.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SignUpRequest {
    private String email;
    private String password;
    private String name;
    private String tel;
    private boolean termsAgreed;
    private boolean privacyAgreed;
    private boolean marketingAgreed;
}

package com.happiness.admin.controller;

import com.happiness.admin.dto.SystemStatusDto;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;

@RestController
@RequestMapping("/api/admin/system")
@RequiredArgsConstructor
public class AdminSystemController {

    private final Environment env;

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @GetMapping("/status")
    public ResponseEntity<SystemStatusDto> status() {
        String activeProfile = Arrays.stream(env.getActiveProfiles())
                .findFirst().orElse("default");
        String dbType = activeProfile.equals("prod") ? "PostgreSQL" : "H2";

        return ResponseEntity.ok(SystemStatusDto.builder()
                .mailConfigured(!mailHost.isBlank())
                .mailHost(mailHost.isBlank() ? "미설정" : mailHost)
                .mailUsername(mailUsername.isBlank() ? "미설정" : mailUsername)
                .rateLimitCapacity("100")
                .rateLimitRefillTokens("10")
                .rateLimitRefillSeconds("1")
                .dbType(dbType)
                .activeProfile(activeProfile)
                .build());
    }
}

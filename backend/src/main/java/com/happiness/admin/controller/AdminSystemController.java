package com.happiness.admin.controller;

import com.happiness.admin.dto.ActivityHeatmapDayDto;
import com.happiness.admin.dto.AdminActivityLogDto;
import com.happiness.admin.dto.PageResponse;
import com.happiness.admin.dto.SystemStatusDto;
import com.happiness.admin.entity.AdminActivityLog;
import com.happiness.admin.repository.AdminActivityLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/system")
@RequiredArgsConstructor
public class AdminSystemController {

    private final Environment env;
    private final AdminActivityLogRepository activityLogRepository;

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

    @GetMapping("/activity-logs")
    public ResponseEntity<?> activityLogs(
            @RequestParam(required = false) Long adminId,
            @RequestParam(required = false) String action,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var pageable = PageRequest.of(page, size);
        var logs = activityLogRepository.searchLogs(adminId, action, pageable)
                .map(AdminActivityLogDto::from);
        return ResponseEntity.ok(PageResponse.of(logs));
    }

    @PostMapping("/activity-logs")
    public ResponseEntity<?> logActivity(@RequestBody AdminActivityLog log) {
        return ResponseEntity.ok(activityLogRepository.save(log));
    }

    @GetMapping("/activity-heatmap")
    public ResponseEntity<List<ActivityHeatmapDayDto>> activityHeatmap(
            @RequestParam(defaultValue = "7") int weeks) {
        int days = weeks * 7;
        LocalDate today = LocalDate.now();
        LocalDate since = today.minusDays(days - 1L);
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        Map<String, Long> countByDay = new HashMap<>();
        for (Object[] row : activityLogRepository.dailyActivity(since.atStartOfDay())) {
            countByDay.put(((LocalDate) row[0]).format(fmt), (Long) row[1]);
        }

        List<ActivityHeatmapDayDto> result = new ArrayList<>();
        for (int i = days - 1; i >= 0; i--) {
            String day = today.minusDays(i).format(fmt);
            result.add(ActivityHeatmapDayDto.builder()
                    .day(day)
                    .count(countByDay.getOrDefault(day, 0L))
                    .build());
        }
        return ResponseEntity.ok(result);
    }
}

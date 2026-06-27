package com.happiness.admin.service;

import com.happiness.admin.entity.SystemConfig;
import com.happiness.admin.repository.SystemConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminContentPolicyService {

    private final SystemConfigRepository configRepository;

    private static final Map<String, String> DEFAULTS = Map.of(
        "sort.default", "composite",
        "sort.new_author_boost_days", "30",
        "sort.composite_likes_weight", "0.5",
        "sort.composite_inquiries_weight", "0.3",
        "sort.composite_views_weight", "0.2",
        "maintenance.enabled", "false",
        "maintenance.message", "시스템 점검 중입니다. 잠시 후 다시 이용해 주세요."
    );

    public Map<String, String> getPolicy() {
        Map<String, String> result = new HashMap<>(DEFAULTS);
        configRepository.findAll().forEach(c -> result.put(c.getKey(), c.getValue()));
        return result;
    }

    @Transactional
    public Map<String, String> updatePolicy(Map<String, String> updates) {
        for (Map.Entry<String, String> entry : updates.entrySet()) {
            SystemConfig config = configRepository.findById(entry.getKey())
                    .orElse(SystemConfig.builder().key(entry.getKey()).build());
            config.setValue(entry.getValue());
            configRepository.save(config);
        }
        return getPolicy();
    }

    public boolean isMaintenanceEnabled() {
        return configRepository.findById("maintenance.enabled")
                .map(c -> "true".equalsIgnoreCase(c.getValue()))
                .orElse(false);
    }
}

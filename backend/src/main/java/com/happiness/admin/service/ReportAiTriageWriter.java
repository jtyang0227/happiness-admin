package com.happiness.admin.service;

import com.happiness.admin.entity.Report;
import com.happiness.admin.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class ReportAiTriageWriter {

    private final ReportRepository reportRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void save(Long reportId, String summary, String severity, String suggestedAction) {
        reportRepository.findById(reportId).ifPresent(report -> {
            report.setAiSummary(summary);
            report.setAiSeverity(severity);
            report.setAiSuggestedAction(suggestedAction);
            report.setAiAnalyzedAt(LocalDateTime.now());
            reportRepository.save(report);
        });
    }
}

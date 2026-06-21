package com.happiness.admin.service;

import com.happiness.admin.dto.AdminReportDto;
import com.happiness.admin.dto.PageResponse;
import com.happiness.admin.dto.ReportProcessRequest;
import com.happiness.admin.entity.Report;
import com.happiness.admin.repository.PhotoRepository;
import com.happiness.admin.repository.ReportRepository;
import com.happiness.admin.repository.SeriesPhotoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminReportService {

    private final ReportRepository reportRepository;
    private final PhotoRepository photoRepository;
    private final SeriesPhotoRepository seriesPhotoRepository;

    public PageResponse<AdminReportDto> getReports(String status, String targetType, int page, int size) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return PageResponse.of(reportRepository.searchReports(
                (status != null && !status.isBlank()) ? status : null,
                (targetType != null && !targetType.isBlank()) ? targetType : null,
                pageable
        ).map(AdminReportDto::from));
    }

    public AdminReportDto getReport(Long id) {
        return reportRepository.findById(id)
                .map(AdminReportDto::from)
                .orElseThrow(() -> new IllegalArgumentException("신고를 찾을 수 없습니다."));
    }

    public Map<String, Long> getCounts() {
        return Map.of(
                "PENDING", reportRepository.countByStatus("PENDING"),
                "IN_REVIEW", reportRepository.countByStatus("IN_REVIEW"),
                "ACTION_TAKEN", reportRepository.countByStatus("ACTION_TAKEN"),
                "DISMISSED", reportRepository.countByStatus("DISMISSED")
        );
    }

    @Transactional
    public AdminReportDto process(Long id, ReportProcessRequest req) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("신고를 찾을 수 없습니다."));

        report.setProcessMemo(req.getMemo());
        report.setProcessedAt(LocalDateTime.now());

        switch (req.getAction()) {
            case "DISMISS" -> report.setStatus("DISMISSED");
            case "DELETE_CONTENT" -> {
                deleteTarget(report);
                report.setStatus("ACTION_TAKEN");
            }
            default -> report.setStatus("ACTION_TAKEN");
        }

        return AdminReportDto.from(reportRepository.save(report));
    }

    private void deleteTarget(Report report) {
        if ("PHOTO".equals(report.getTargetType())) {
            photoRepository.findById(report.getTargetId()).ifPresent(photo -> {
                seriesPhotoRepository.deleteByPhotoId(photo.getId());
                photoRepository.delete(photo);
            });
        }
    }
}

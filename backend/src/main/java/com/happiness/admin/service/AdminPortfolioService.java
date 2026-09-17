package com.happiness.admin.service;

import com.happiness.admin.dto.AdminPortfolioDto;
import com.happiness.admin.dto.PageResponse;
import com.happiness.admin.entity.Portfolio;
import com.happiness.admin.entity.PortfolioStatus;
import com.happiness.admin.entity.PortfolioVisibility;
import com.happiness.admin.repository.PortfolioItemRepository;
import com.happiness.admin.repository.PortfolioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminPortfolioService {

    private final PortfolioRepository portfolioRepository;
    private final PortfolioItemRepository portfolioItemRepository;

    public PageResponse<AdminPortfolioDto> getPortfolios(String status, String visibility, Long memberId, String search, String sortBy, int page, int size) {
        PortfolioStatus st = (status != null && !status.isBlank()) ? PortfolioStatus.valueOf(status) : null;
        PortfolioVisibility vis = (visibility != null && !visibility.isBlank()) ? PortfolioVisibility.valueOf(visibility) : null;
        String s = (search != null && !search.isBlank()) ? search.trim() : null;
        var pageable = PageRequest.of(page, size, resolveSort(sortBy));
        var portfolioPage = portfolioRepository.searchPortfolios(st, vis, memberId, s, pageable);

        List<Long> portfolioIds = portfolioPage.getContent().stream().map(Portfolio::getId).toList();
        Map<Long, int[]> itemCounts = new HashMap<>();
        if (!portfolioIds.isEmpty()) {
            for (Object[] row : portfolioItemRepository.countByPortfolioIdInGroupByType(portfolioIds)) {
                Long portfolioId = (Long) row[0];
                String itemType = (String) row[1];
                long count = (Long) row[2];
                int[] counts = itemCounts.computeIfAbsent(portfolioId, k -> new int[2]);
                if ("PHOTO".equals(itemType)) counts[0] = (int) count;
                else if ("SERIES".equals(itemType)) counts[1] = (int) count;
            }
        }

        return PageResponse.of(portfolioPage.map(p -> {
            int[] counts = itemCounts.getOrDefault(p.getId(), new int[2]);
            return AdminPortfolioDto.from(p, counts[0], counts[1]);
        }));
    }

    private Sort resolveSort(String sortBy) {
        if (sortBy == null) return Sort.by("createdAt").descending();
        return switch (sortBy) {
            case "likes" -> Sort.by("likesCount").descending();
            case "views" -> Sort.by("viewCount").descending();
            case "oldest" -> Sort.by("createdAt").ascending();
            default -> Sort.by("createdAt").descending();
        };
    }

    public AdminPortfolioDto getPortfolio(Long id) {
        Portfolio p = portfolioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("포트폴리오를 찾을 수 없습니다."));
        return AdminPortfolioDto.from(p);
    }

    public Map<String, Long> getStatusCounts() {
        return Map.of(
            "DRAFT",    portfolioRepository.countByStatus(PortfolioStatus.DRAFT),
            "PENDING",  portfolioRepository.countByStatus(PortfolioStatus.PENDING),
            "APPROVED", portfolioRepository.countByStatus(PortfolioStatus.APPROVED),
            "REJECTED", portfolioRepository.countByStatus(PortfolioStatus.REJECTED)
        );
    }

    @Transactional
    public AdminPortfolioDto approve(Long id, String adminNote) {
        Portfolio p = portfolioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("포트폴리오를 찾을 수 없습니다."));
        p.setStatus(PortfolioStatus.APPROVED);
        p.setAdminNote(adminNote);
        p.setReviewedAt(LocalDateTime.now());
        return AdminPortfolioDto.from(portfolioRepository.save(p));
    }

    @Transactional
    public AdminPortfolioDto reject(Long id, String adminNote) {
        Portfolio p = portfolioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("포트폴리오를 찾을 수 없습니다."));
        p.setStatus(PortfolioStatus.REJECTED);
        p.setAdminNote(adminNote);
        p.setReviewedAt(LocalDateTime.now());
        return AdminPortfolioDto.from(portfolioRepository.save(p));
    }

    @Transactional
    public AdminPortfolioDto hide(Long id) {
        Portfolio p = portfolioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("포트폴리오를 찾을 수 없습니다."));
        p.setVisibility(PortfolioVisibility.PRIVATE);
        return AdminPortfolioDto.from(portfolioRepository.save(p));
    }

    @Transactional
    public void delete(Long id) {
        portfolioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("포트폴리오를 찾을 수 없습니다."));
        portfolioRepository.deleteById(id);
    }
}

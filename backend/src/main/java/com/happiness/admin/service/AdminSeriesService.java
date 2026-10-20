package com.happiness.admin.service;

import com.happiness.admin.dto.AdminSeriesDto;
import com.happiness.admin.dto.PageResponse;
import com.happiness.admin.entity.Series;
import com.happiness.admin.repository.SeriesPhotoRepository;
import com.happiness.admin.repository.SeriesRepository;
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
public class AdminSeriesService {

    private final SeriesRepository seriesRepository;
    private final SeriesPhotoRepository seriesPhotoRepository;
    private final AdminActivityRecorder activityRecorder;

    public PageResponse<AdminSeriesDto> getSeries(Long memberId, String search, String sortBy, int page, int size) {
        var pageable = PageRequest.of(page, size, resolveSort(sortBy));
        String searchTerm = (search != null && !search.isBlank()) ? search.trim() : null;
        var seriesPage = seriesRepository.searchSeries(memberId, searchTerm, pageable);

        List<Long> seriesIds = seriesPage.getContent().stream().map(Series::getId).toList();
        Map<Long, Long> photoCounts = seriesIds.isEmpty()
                ? Map.of() : toCountMap(seriesPhotoRepository.countBySeriesIdIn(seriesIds));

        return PageResponse.of(seriesPage.map(s -> AdminSeriesDto.from(s, photoCounts.getOrDefault(s.getId(), 0L))));
    }

    public PageResponse<AdminSeriesDto> getCurationCandidates(Boolean featured, String search, int page, int size) {
        Sort sort = Boolean.TRUE.equals(featured)
                ? Sort.by("featuredAt").descending().and(Sort.by("id").descending())
                : Sort.by("createdAt").descending().and(Sort.by("id").descending());
        String searchTerm = (search != null && !search.isBlank()) ? search.trim() : null;
        var seriesPage = seriesRepository.searchCuration(featured, searchTerm, PageRequest.of(page, size, sort));

        List<Long> seriesIds = seriesPage.getContent().stream().map(Series::getId).toList();
        Map<Long, Long> photoCounts = seriesIds.isEmpty()
                ? Map.of() : toCountMap(seriesPhotoRepository.countBySeriesIdIn(seriesIds));

        return PageResponse.of(seriesPage.map(s -> AdminSeriesDto.from(s, photoCounts.getOrDefault(s.getId(), 0L))));
    }

    @Transactional
    public AdminSeriesDto setFeatured(Long id, boolean featured) {
        Series series = seriesRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("작업을 찾을 수 없습니다."));
        long photoCount = seriesPhotoRepository.countBySeriesId(id);
        if (featured && Boolean.TRUE.equals(series.getDraft())) {
            throw new IllegalArgumentException("초안 작업은 추천할 수 없어요.");
        }
        if (featured && photoCount == 0) {
            throw new IllegalArgumentException("사진이 없는 작업은 추천할 수 없어요.");
        }
        // updatedAt을 건드리지 않도록 bulk UPDATE — App 탐색 "최신순"이 추천 때문에 흔들리지 않게 한다.
        seriesRepository.updateFeaturedAt(id, featured ? LocalDateTime.now() : null);
        activityRecorder.record(featured ? "CURATION_FEATURE" : "CURATION_UNFEATURE", "SERIES", id, series.getTitle());
        return AdminSeriesDto.from(seriesRepository.findById(id).orElseThrow(), photoCount);
    }

    private static Map<Long, Long> toCountMap(List<Object[]> rows) {
        Map<Long, Long> map = new HashMap<>();
        for (Object[] row : rows) {
            map.put((Long) row[0], (Long) row[1]);
        }
        return map;
    }

    private Sort resolveSort(String sortBy) {
        if ("likes".equals(sortBy)) return Sort.by("likesCount").descending();
        return Sort.by("createdAt").descending();
    }

    public AdminSeriesDto getSeriesDetail(Long id) {
        Series series = seriesRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("시리즈를 찾을 수 없습니다."));
        return AdminSeriesDto.from(series, seriesPhotoRepository.countBySeriesId(id));
    }

    @Transactional
    public void deleteSeries(Long id) {
        Series series = seriesRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("시리즈를 찾을 수 없습니다."));
        seriesRepository.delete(series);
    }
}

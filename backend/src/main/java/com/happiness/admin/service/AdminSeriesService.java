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

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminSeriesService {

    private final SeriesRepository seriesRepository;
    private final SeriesPhotoRepository seriesPhotoRepository;

    public PageResponse<AdminSeriesDto> getSeries(Long memberId, String search, String sortBy, int page, int size) {
        var pageable = PageRequest.of(page, size, resolveSort(sortBy));
        String searchTerm = (search != null && !search.isBlank()) ? search.trim() : null;
        var seriesPage = seriesRepository.searchSeries(memberId, searchTerm, pageable);

        List<Long> seriesIds = seriesPage.getContent().stream().map(Series::getId).toList();
        Map<Long, Long> photoCounts = seriesIds.isEmpty()
                ? Map.of() : toCountMap(seriesPhotoRepository.countBySeriesIdIn(seriesIds));

        return PageResponse.of(seriesPage.map(s -> AdminSeriesDto.from(s, photoCounts.getOrDefault(s.getId(), 0L))));
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

package com.happiness.admin.service;

import com.happiness.admin.dto.AdminSeriesDto;
import com.happiness.admin.dto.PageResponse;
import com.happiness.admin.entity.Series;
import com.happiness.admin.repository.SeriesRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminSeriesService {

    private final SeriesRepository seriesRepository;

    public PageResponse<AdminSeriesDto> getSeries(Long memberId, String search, int page, int size) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        String searchTerm = (search != null && !search.isBlank()) ? search.trim() : null;
        return PageResponse.of(
                seriesRepository.searchSeries(memberId, searchTerm, pageable).map(AdminSeriesDto::from));
    }

    @Transactional
    public void deleteSeries(Long id) {
        Series series = seriesRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("시리즈를 찾을 수 없습니다."));
        seriesRepository.delete(series);
    }
}

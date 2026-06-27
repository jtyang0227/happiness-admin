package com.happiness.admin.service;

import com.happiness.admin.dto.*;
import com.happiness.admin.entity.*;
import com.happiness.admin.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminSortService {

    private final PhotoRepository photoRepository;
    private final SeriesRepository seriesRepository;
    private final SeriesPhotoRepository seriesPhotoRepository;
    private final PortfolioItemRepository portfolioItemRepository;

    public List<SortPhotoDto> getPhotosForSort() {
        return photoRepository.findAllOrderedForSort()
                .stream().map(SortPhotoDto::from).collect(Collectors.toList());
    }

    @Transactional
    public void reorderPhotos(List<ReorderItem> items) {
        Map<Long, Photo> map = photoRepository.findAll()
                .stream().collect(Collectors.toMap(Photo::getId, Function.identity()));
        for (ReorderItem item : items) {
            Photo p = map.get(item.getId());
            if (p != null) {
                p.setDisplayOrder(item.getDisplayOrder());
                photoRepository.save(p);
            }
        }
    }

    public List<SortSeriesDto> getSeriesForSort() {
        return seriesRepository.findAllOrderedForSort()
                .stream().map(SortSeriesDto::from).collect(Collectors.toList());
    }

    @Transactional
    public void reorderSeries(List<ReorderItem> items) {
        Map<Long, Series> map = seriesRepository.findAll()
                .stream().collect(Collectors.toMap(Series::getId, Function.identity()));
        for (ReorderItem item : items) {
            Series s = map.get(item.getId());
            if (s != null) {
                s.setDisplayOrder(item.getDisplayOrder());
                seriesRepository.save(s);
            }
        }
    }

    public List<SortSeriesPhotoDto> getSeriesPhotosForSort(Long seriesId) {
        return seriesPhotoRepository.findBySeriesIdOrdered(seriesId)
                .stream().map(SortSeriesPhotoDto::from).collect(Collectors.toList());
    }

    @Transactional
    public void reorderSeriesPhotos(Long seriesId, List<ReorderItem> items) {
        List<SeriesPhoto> photos = seriesPhotoRepository.findBySeriesIdOrdered(seriesId);
        Map<Long, SeriesPhoto> map = photos.stream()
                .collect(Collectors.toMap(SeriesPhoto::getId, Function.identity()));
        for (ReorderItem item : items) {
            SeriesPhoto sp = map.get(item.getId());
            if (sp != null) {
                sp.setDisplayOrder(item.getDisplayOrder());
                seriesPhotoRepository.save(sp);
            }
        }
    }

    public List<SortPortfolioItemDto> getPortfolioItemsForSort(Long portfolioId) {
        return portfolioItemRepository.findByPortfolioIdOrdered(portfolioId)
                .stream().map(SortPortfolioItemDto::from).collect(Collectors.toList());
    }

    @Transactional
    public void reorderPortfolioItems(Long portfolioId, List<ReorderItem> items) {
        List<PortfolioItem> portItems = portfolioItemRepository.findByPortfolioIdOrdered(portfolioId);
        Map<Long, PortfolioItem> map = portItems.stream()
                .collect(Collectors.toMap(PortfolioItem::getId, Function.identity()));
        for (ReorderItem item : items) {
            PortfolioItem pi = map.get(item.getId());
            if (pi != null) {
                pi.setDisplayOrder(item.getDisplayOrder());
                portfolioItemRepository.save(pi);
            }
        }
    }
}

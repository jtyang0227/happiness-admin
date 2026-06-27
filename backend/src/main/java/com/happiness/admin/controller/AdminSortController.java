package com.happiness.admin.controller;

import com.happiness.admin.dto.*;
import com.happiness.admin.service.AdminSortService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/sort")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('WM','SA')")
public class AdminSortController {

    private final AdminSortService sortService;

    @GetMapping("/photos")
    public ResponseEntity<List<SortPhotoDto>> getPhotos() {
        return ResponseEntity.ok(sortService.getPhotosForSort());
    }

    @PutMapping("/photos")
    public ResponseEntity<Void> reorderPhotos(@RequestBody List<ReorderItem> items) {
        sortService.reorderPhotos(items);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/series")
    public ResponseEntity<List<SortSeriesDto>> getSeries() {
        return ResponseEntity.ok(sortService.getSeriesForSort());
    }

    @PutMapping("/series")
    public ResponseEntity<Void> reorderSeries(@RequestBody List<ReorderItem> items) {
        sortService.reorderSeries(items);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/series/{id}/photos")
    public ResponseEntity<List<SortSeriesPhotoDto>> getSeriesPhotos(@PathVariable Long id) {
        return ResponseEntity.ok(sortService.getSeriesPhotosForSort(id));
    }

    @PutMapping("/series/{id}/photos")
    public ResponseEntity<Void> reorderSeriesPhotos(
            @PathVariable Long id, @RequestBody List<ReorderItem> items) {
        sortService.reorderSeriesPhotos(id, items);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/portfolios/{id}/items")
    public ResponseEntity<List<SortPortfolioItemDto>> getPortfolioItems(@PathVariable Long id) {
        return ResponseEntity.ok(sortService.getPortfolioItemsForSort(id));
    }

    @PutMapping("/portfolios/{id}/items")
    public ResponseEntity<Void> reorderPortfolioItems(
            @PathVariable Long id, @RequestBody List<ReorderItem> items) {
        sortService.reorderPortfolioItems(id, items);
        return ResponseEntity.ok().build();
    }
}

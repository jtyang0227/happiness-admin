package com.happiness.admin.service;

import com.happiness.admin.dto.AdminPhotoDto;
import com.happiness.admin.dto.PageResponse;
import com.happiness.admin.entity.Photo;
import com.happiness.admin.repository.PhotoRepository;
import com.happiness.admin.repository.SeriesPhotoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminPhotoService {

    private final PhotoRepository photoRepository;
    private final SeriesPhotoRepository seriesPhotoRepository;

    public PageResponse<AdminPhotoDto> getPhotos(Long memberId, String colorMood, String search, String sortBy, int page, int size) {
        Sort sort = switch (sortBy != null ? sortBy : "latest") {
            case "likes"  -> Sort.by("likesCount").descending();
            case "saves"  -> Sort.by("savesCount").descending();
            case "shares" -> Sort.by("sharesCount").descending();
            default       -> Sort.by("createdAt").descending();
        };
        var pageable = PageRequest.of(page, size, sort);
        String searchTerm = (search != null && !search.isBlank()) ? search.trim() : null;
        return PageResponse.of(
                photoRepository.searchPhotos(memberId, colorMood, searchTerm, pageable).map(AdminPhotoDto::from));
    }

    @Transactional
    public void deletePhoto(Long id) {
        Photo photo = photoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("사진을 찾을 수 없습니다."));
        seriesPhotoRepository.deleteByPhotoId(id);
        photoRepository.delete(photo);
    }
}

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

import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminPhotoService {

    private final PhotoRepository photoRepository;
    private final SeriesPhotoRepository seriesPhotoRepository;

    private static final Map<String, String> MOOD_ALIASES = Map.ofEntries(
        Map.entry("따뜻", "WARM"),   Map.entry("웜", "WARM"),
        Map.entry("차가운", "COOL"), Map.entry("쿨", "COOL"),
        Map.entry("중성", "NEUTRAL"), Map.entry("뉴트럴", "NEUTRAL"),
        Map.entry("선명", "VIVID"),  Map.entry("비비드", "VIVID"),
        Map.entry("어두운", "DARK"), Map.entry("다크", "DARK"),
        Map.entry("부드러운", "SOFT"), Map.entry("소프트", "SOFT")
    );

    private String resolveColorMood(String colorMood) {
        if (colorMood == null || colorMood.isBlank()) return null;
        String upper = colorMood.trim().toUpperCase();
        if (upper.matches("WARM|COOL|NEUTRAL|VIVID|DARK|SOFT")) return upper;
        for (Map.Entry<String, String> e : MOOD_ALIASES.entrySet()) {
            if (colorMood.trim().contains(e.getKey())) return e.getValue();
        }
        return colorMood.trim().toUpperCase();
    }

    public PageResponse<AdminPhotoDto> getPhotos(Long memberId, String colorMood,
            String l1, String l2, String l3, String l4, String l5,
            String search, String sortBy, int page, int size) {
        Sort sort = switch (sortBy != null ? sortBy : "latest") {
            case "likes"  -> Sort.by("likesCount").descending();
            case "saves"  -> Sort.by("savesCount").descending();
            case "shares" -> Sort.by("sharesCount").descending();
            default       -> Sort.by("createdAt").descending();
        };
        var pageable = PageRequest.of(page, size, sort);
        String searchTerm = (search != null && !search.isBlank()) ? search.trim() : null;
        String resolvedMood = resolveColorMood(colorMood);
        String rl1 = blank(l1); String rl2 = blank(l2); String rl3 = blank(l3);
        String rl4 = blank(l4); String rl5 = blank(l5);
        return PageResponse.of(
                photoRepository.searchPhotos(memberId, resolvedMood, rl1, rl2, rl3, rl4, rl5, searchTerm, pageable)
                        .map(AdminPhotoDto::from));
    }

    @Transactional
    public void deletePhoto(Long id) {
        Photo photo = photoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("사진을 찾을 수 없습니다."));
        seriesPhotoRepository.deleteByPhotoId(id);
        photoRepository.delete(photo);
    }

    @Transactional
    public AdminPhotoDto updateCategoryCode(Long id, String categoryCode) {
        Photo photo = photoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("사진을 찾을 수 없습니다."));
        photo.setCategoryCode(categoryCode);
        return AdminPhotoDto.from(photoRepository.save(photo));
    }

    private String blank(String s) { return (s != null && !s.isBlank()) ? s.trim() : null; }
}

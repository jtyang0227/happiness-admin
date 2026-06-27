package com.happiness.admin.service;

import com.happiness.admin.dto.AdminFeaturedDto;
import com.happiness.admin.dto.FeaturedRequest;
import com.happiness.admin.entity.FeaturedItem;
import com.happiness.admin.entity.Photo;
import com.happiness.admin.repository.FeaturedItemRepository;
import com.happiness.admin.repository.PhotoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminFeaturedService {

    private static final int MAX_FEATURED = 10;

    private final FeaturedItemRepository featuredItemRepository;
    private final PhotoRepository photoRepository;

    public List<AdminFeaturedDto> getFeatured() {
        return featuredItemRepository.findAllByOrderByDisplayOrderAsc()
                .stream().map(AdminFeaturedDto::from).collect(Collectors.toList());
    }

    @Transactional
    public AdminFeaturedDto addFeatured(FeaturedRequest req, Long adminId) {
        if (featuredItemRepository.count() >= MAX_FEATURED) {
            throw new IllegalArgumentException("피처드 사진은 최대 " + MAX_FEATURED + "개까지 등록할 수 있습니다.");
        }
        if (featuredItemRepository.existsByPhotoId(req.photoId())) {
            throw new IllegalArgumentException("이미 피처드에 등록된 사진입니다.");
        }
        Photo photo = photoRepository.findById(req.photoId())
                .orElseThrow(() -> new IllegalArgumentException("사진을 찾을 수 없습니다."));
        int nextOrder = (int) featuredItemRepository.count();
        FeaturedItem item = FeaturedItem.builder()
                .photo(photo)
                .displayOrder(nextOrder)
                .startsAt(req.startsAt())
                .endsAt(req.endsAt())
                .addedById(adminId)
                .build();
        return AdminFeaturedDto.from(featuredItemRepository.save(item));
    }

    @Transactional
    public void removeFeatured(Long id) {
        FeaturedItem item = featuredItemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("피처드 항목을 찾을 수 없습니다."));
        featuredItemRepository.delete(item);
        resequence();
    }

    @Transactional
    public List<AdminFeaturedDto> reorder(List<Long> orderedIds) {
        List<FeaturedItem> items = featuredItemRepository.findAllByOrderByDisplayOrderAsc();
        for (int i = 0; i < orderedIds.size(); i++) {
            final int idx = i;
            final Long itemId = orderedIds.get(i);
            items.stream().filter(f -> f.getId().equals(itemId)).findFirst()
                    .ifPresent(f -> f.setDisplayOrder(idx));
        }
        featuredItemRepository.saveAll(items);
        return getFeatured();
    }

    private void resequence() {
        List<FeaturedItem> items = featuredItemRepository.findAllByOrderByDisplayOrderAsc();
        for (int i = 0; i < items.size(); i++) {
            items.get(i).setDisplayOrder(i);
        }
        featuredItemRepository.saveAll(items);
    }
}

package com.happiness.admin.service;

import com.happiness.admin.dto.AdminBannerDto;
import com.happiness.admin.dto.BannerRequest;
import com.happiness.admin.entity.Banner;
import com.happiness.admin.repository.BannerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminBannerService {

    private final BannerRepository bannerRepository;

    public List<AdminBannerDto> getBanners() {
        return bannerRepository.findAllByOrderByDisplayOrderAsc()
                .stream().map(AdminBannerDto::from).collect(Collectors.toList());
    }

    @Transactional
    public AdminBannerDto createBanner(BannerRequest req) {
        int maxOrder = bannerRepository.findAllByOrderByDisplayOrderAsc().stream()
                .mapToInt(Banner::getDisplayOrder).max().orElse(0);
        Banner banner = Banner.builder()
                .title(req.getTitle())
                .imageUrl(req.getImageUrl())
                .linkUrl(req.getLinkUrl())
                .isActive(req.isActive())
                .displayOrder(maxOrder + 1)
                .startsAt(req.getStartsAt())
                .endsAt(req.getEndsAt())
                .build();
        return AdminBannerDto.from(bannerRepository.save(banner));
    }

    @Transactional
    public AdminBannerDto updateBanner(Long id, BannerRequest req) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("배너를 찾을 수 없습니다."));
        banner.setTitle(req.getTitle());
        banner.setImageUrl(req.getImageUrl());
        banner.setLinkUrl(req.getLinkUrl());
        banner.setActive(req.isActive());
        banner.setStartsAt(req.getStartsAt());
        banner.setEndsAt(req.getEndsAt());
        return AdminBannerDto.from(bannerRepository.save(banner));
    }

    @Transactional
    public void deleteBanner(Long id) {
        if (!bannerRepository.existsById(id)) {
            throw new IllegalArgumentException("배너를 찾을 수 없습니다.");
        }
        bannerRepository.deleteById(id);
    }

    @Transactional
    public void reorder(List<Long> orderedIds) {
        for (int i = 0; i < orderedIds.size(); i++) {
            Long bannerId = orderedIds.get(i);
            bannerRepository.findById(bannerId).ifPresent(b -> {
                b.setDisplayOrder(orderedIds.indexOf(bannerId) + 1);
                bannerRepository.save(b);
            });
        }
    }

    @Transactional
    public AdminBannerDto toggleActive(Long id) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("배너를 찾을 수 없습니다."));
        banner.setActive(!banner.isActive());
        return AdminBannerDto.from(bannerRepository.save(banner));
    }
}

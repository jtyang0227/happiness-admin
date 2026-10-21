package com.happiness.admin.service;

import com.happiness.admin.dto.PageResponse;
import com.happiness.admin.dto.ProfileContentDto;
import com.happiness.admin.entity.*;
import com.happiness.admin.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminProfileContentService {

    private static final Map<String, String> TYPE_LABELS = Map.of(
            "testimonials", "후기", "pricing", "가격 패키지", "press", "언론 보도",
            "achievements", "수상·전시", "brands", "클라이언트 브랜드");

    private final TestimonialRepository testimonialRepository;
    private final PricingPackageRepository pricingRepository;
    private final PressFeatureRepository pressRepository;
    private final AchievementRepository achievementRepository;
    private final ClientBrandRepository brandRepository;
    private final MemberRepository memberRepository;
    private final AdminActivityRecorder activityRecorder;

    public PageResponse<ProfileContentDto> getContents(String type, Long memberId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending().and(Sort.by("id").descending()));
        Page<ProfileContentDto> result = switch (requireType(type)) {
            case "testimonials" -> testimonialRepository.findByMember(memberId, pageable).map(this::toDto);
            case "pricing" -> pricingRepository.findByMember(memberId, pageable).map(this::toDto);
            case "press" -> pressRepository.findByMember(memberId, pageable).map(this::toDto);
            case "achievements" -> achievementRepository.findByMember(memberId, pageable).map(this::toDto);
            default -> brandRepository.findByMember(memberId, pageable).map(this::toDto);
        };
        fillMemberNames(result.getContent());
        return PageResponse.of(result);
    }

    public Map<String, Long> getCounts() {
        Map<String, Long> counts = new LinkedHashMap<>();
        counts.put("testimonials", testimonialRepository.count());
        counts.put("pricing", pricingRepository.count());
        counts.put("press", pressRepository.count());
        counts.put("achievements", achievementRepository.count());
        counts.put("brands", brandRepository.count());
        return counts;
    }

    @Transactional
    public void delete(String type, Long id) {
        ProfileContentDto target = switch (requireType(type)) {
            case "testimonials" -> deleteFrom(testimonialRepository, id, this::toDto);
            case "pricing" -> deleteFrom(pricingRepository, id, this::toDto);
            case "press" -> deleteFrom(pressRepository, id, this::toDto);
            case "achievements" -> deleteFrom(achievementRepository, id, this::toDto);
            default -> deleteFrom(brandRepository, id, this::toDto);
        };
        activityRecorder.record("PROFILE_CONTENT_DELETE", type.toUpperCase(), id,
                TYPE_LABELS.get(type) + " · 작가 #" + target.getMemberId() + " · " + target.getTitle());
    }

    private <T> ProfileContentDto deleteFrom(org.springframework.data.jpa.repository.JpaRepository<T, Long> repo,
                                             Long id, Function<T, ProfileContentDto> mapper) {
        T entity = repo.findById(id).orElseThrow(() -> new IllegalArgumentException("콘텐츠를 찾을 수 없습니다."));
        ProfileContentDto dto = mapper.apply(entity);
        repo.delete(entity);
        return dto;
    }

    private String requireType(String type) {
        if (type == null || !TYPE_LABELS.containsKey(type)) {
            throw new IllegalArgumentException("type은 " + String.join("/", TYPE_LABELS.keySet()) + " 중 하나여야 합니다.");
        }
        return type;
    }

    private void fillMemberNames(List<ProfileContentDto> items) {
        List<Long> ids = items.stream().map(ProfileContentDto::getMemberId).distinct().toList();
        if (ids.isEmpty()) return;
        Map<Long, String> names = memberRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(Member::getId, Member::getName));
        items.forEach(i -> i.setMemberName(names.get(i.getMemberId())));
    }

    private ProfileContentDto toDto(Testimonial t) {
        List<String> tags = new ArrayList<>();
        if (t.isFeatured()) tags.add("대표 후기");
        if (t.getSeriesId() != null) tags.add("작업 #" + t.getSeriesId());
        return base("testimonials", t.getId(), t.getMemberId(), t.getCreatedAt())
                .title(t.getClientName())
                .subtitle(join(t.getClientRole(), t.getShootDate()))
                .body(t.getContent()).tags(tags).build();
    }

    private ProfileContentDto toDto(PricingPackage p) {
        List<String> tags = new ArrayList<>();
        if (p.isFeatured()) tags.add("추천");
        if (!p.isActive()) tags.add("비활성");
        String price = p.getPrice() != null ? String.format("%,d원", p.getPrice()) : p.getPriceLabel();
        return base("pricing", p.getId(), p.getMemberId(), p.getCreatedAt())
                .title(p.getName()).subtitle(price).body(p.getDescription()).tags(tags).build();
    }

    private ProfileContentDto toDto(PressFeature p) {
        return base("press", p.getId(), p.getMemberId(), p.getCreatedAt())
                .title(p.getTitle() != null ? p.getTitle() : p.getPublication())
                .subtitle(join(p.getPublication(), p.getPublishedDate()))
                .linkUrl(p.getUrl()).imageUrl(p.getLogoUrl()).tags(List.of()).build();
    }

    private ProfileContentDto toDto(Achievement a) {
        String typeLabel = switch (a.getType()) {
            case "AWARD" -> "수상";
            case "EXHIBITION" -> "전시";
            case "PUBLICATION" -> "출판";
            default -> a.getType();
        };
        return base("achievements", a.getId(), a.getMemberId(), a.getCreatedAt())
                .title(a.getTitle())
                .subtitle(join(a.getOrganizer(), a.getLocation(), a.getYearMonth()))
                .linkUrl(a.getUrl()).tags(List.of(typeLabel)).build();
    }

    private ProfileContentDto toDto(ClientBrand b) {
        return base("brands", b.getId(), b.getMemberId(), b.getCreatedAt())
                .title(b.getName()).imageUrl(b.getLogoUrl()).tags(List.of()).build();
    }

    private static ProfileContentDto.ProfileContentDtoBuilder base(String type, Long id, Long memberId, java.time.LocalDateTime at) {
        return ProfileContentDto.builder().type(type).id(id).memberId(memberId).createdAt(at);
    }

    private static String join(String... parts) {
        return java.util.Arrays.stream(parts).filter(s -> s != null && !s.isBlank()).collect(Collectors.joining(" · "));
    }
}

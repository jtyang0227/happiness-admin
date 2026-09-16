package com.happiness.admin.service;

import com.happiness.admin.dto.AdminMemberDto;
import com.happiness.admin.dto.PageResponse;
import com.happiness.admin.entity.Authority;
import com.happiness.admin.entity.Member;
import com.happiness.admin.entity.MemberStatus;
import com.happiness.admin.repository.InquiryRepository;
import com.happiness.admin.repository.MemberRepository;
import com.happiness.admin.repository.PhotoRepository;
import com.happiness.admin.repository.PortfolioRepository;
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
public class AdminMemberService {

    private final MemberRepository memberRepository;
    private final PhotoRepository photoRepository;
    private final SeriesRepository seriesRepository;
    private final InquiryRepository inquiryRepository;
    private final SeriesPhotoRepository seriesPhotoRepository;
    private final PortfolioRepository portfolioRepository;

    public PageResponse<AdminMemberDto> getMembers(String search, String authorityStr, String statusStr, int page, int size) {
        Authority authority = (authorityStr != null && !authorityStr.isBlank())
                ? Authority.valueOf(authorityStr) : null;
        MemberStatus status = (statusStr != null && !statusStr.isBlank())
                ? MemberStatus.valueOf(statusStr) : null;
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        var memberPage = memberRepository.searchMembers(
                (search != null && !search.isBlank()) ? search : null,
                authority, status, pageable
        );

        List<Long> memberIds = memberPage.getContent().stream().map(Member::getId).toList();
        Map<Long, Long> photoCounts = memberIds.isEmpty() ? Map.of() : toCountMap(photoRepository.countByMemberIdIn(memberIds));
        Map<Long, Long> seriesCounts = memberIds.isEmpty() ? Map.of() : toCountMap(seriesRepository.countByMemberIdIn(memberIds));
        Map<Long, Long> inquiryCounts = memberIds.isEmpty() ? Map.of() : toCountMap(inquiryRepository.countBySenderIdIn(memberIds));
        Map<Long, Long> portfolioCounts = memberIds.isEmpty() ? Map.of() : toCountMap(portfolioRepository.countByMemberIdIn(memberIds));

        return PageResponse.of(memberPage.map(m -> AdminMemberDto.from(m,
                photoCounts.getOrDefault(m.getId(), 0L),
                seriesCounts.getOrDefault(m.getId(), 0L),
                inquiryCounts.getOrDefault(m.getId(), 0L),
                portfolioCounts.getOrDefault(m.getId(), 0L))));
    }

    private static Map<Long, Long> toCountMap(List<Object[]> rows) {
        Map<Long, Long> map = new HashMap<>();
        for (Object[] row : rows) {
            map.put((Long) row[0], (Long) row[1]);
        }
        return map;
    }

    public AdminMemberDto getMember(Long id) {
        Member m = memberRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));
        return toDto(m);
    }

    @Transactional
    public void updateRole(Long id, String authorityStr) {
        Member m = memberRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));
        m.setAuthority(Authority.valueOf(authorityStr));
        memberRepository.save(m);
    }

    @Transactional
    public void updateStatus(Long id, String statusStr, String reason, Integer suspendDays) {
        MemberStatus newStatus;
        try {
            newStatus = MemberStatus.valueOf(statusStr);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("잘못된 상태 값입니다: " + statusStr);
        }
        Member m = memberRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));
        m.setStatus(newStatus);
        if (newStatus == MemberStatus.SUSPENDED) {
            m.setSuspendReason(reason);
            m.setSuspendedAt(LocalDateTime.now());
            m.setSuspendUntil(suspendDays != null && suspendDays > 0
                    ? LocalDateTime.now().plusDays(suspendDays) : null);
        } else {
            m.setSuspendReason(null);
            m.setSuspendUntil(null);
            m.setSuspendedAt(null);
        }
        memberRepository.save(m);
    }

    @Transactional
    public void deleteMember(Long id) {
        Member m = memberRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));
        inquiryRepository.deleteBySenderId(id);
        inquiryRepository.deleteByReceiverId(id);
        photoRepository.findByMemberId(id).forEach(p -> {
            seriesPhotoRepository.deleteByPhotoId(p.getId());
            photoRepository.delete(p);
        });
        seriesRepository.findByMemberId(id).forEach(seriesRepository::delete);
        memberRepository.delete(m);
    }

    private AdminMemberDto toDto(Member m) {
        return AdminMemberDto.from(m,
                photoRepository.countByMemberId(m.getId()),
                seriesRepository.countByMemberId(m.getId()),
                inquiryRepository.countBySenderId(m.getId()),
                portfolioRepository.countByMemberId(m.getId()));
    }
}

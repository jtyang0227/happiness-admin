package com.happiness.admin.service;

import com.happiness.admin.dto.AdminMemberDto;
import com.happiness.admin.dto.PageResponse;
import com.happiness.admin.entity.Authority;
import com.happiness.admin.entity.Member;
import com.happiness.admin.entity.MemberStatus;
import com.happiness.admin.repository.InquiryRepository;
import com.happiness.admin.repository.MemberRepository;
import com.happiness.admin.repository.PhotoRepository;
import com.happiness.admin.repository.SeriesPhotoRepository;
import com.happiness.admin.repository.SeriesRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminMemberService {

    private final MemberRepository memberRepository;
    private final PhotoRepository photoRepository;
    private final SeriesRepository seriesRepository;
    private final InquiryRepository inquiryRepository;
    private final SeriesPhotoRepository seriesPhotoRepository;

    public PageResponse<AdminMemberDto> getMembers(String search, String authorityStr, int page, int size) {
        Authority authority = (authorityStr != null && !authorityStr.isBlank())
                ? Authority.valueOf(authorityStr) : null;
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return PageResponse.of(memberRepository.searchMembers(
                (search != null && !search.isBlank()) ? search : null,
                authority, pageable
        ).map(m -> AdminMemberDto.from(m,
                photoRepository.countByMemberId(m.getId()),
                seriesRepository.countByMemberId(m.getId()),
                0)));
    }

    public AdminMemberDto getMember(Long id) {
        Member m = memberRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));
        return AdminMemberDto.from(m,
                photoRepository.countByMemberId(m.getId()),
                seriesRepository.countByMemberId(m.getId()),
                0);
    }

    @Transactional
    public void updateRole(Long id, String authorityStr) {
        Member m = memberRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));
        m.setAuthority(Authority.valueOf(authorityStr));
        memberRepository.save(m);
    }

    @Transactional
    public void updateStatus(Long id, String statusStr, String reason) {
        Member m = memberRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));
        m.setStatus(MemberStatus.valueOf(statusStr));
        memberRepository.save(m);
    }

    @Transactional
    public void deleteMember(Long id) {
        Member m = memberRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다."));
        inquiryRepository.deleteBySenderId(id);
        inquiryRepository.deleteByReceiverId(id);
        photoRepository.findAll().stream()
                .filter(p -> p.getMember().getId().equals(id))
                .forEach(p -> {
                    seriesPhotoRepository.deleteByPhotoId(p.getId());
                    photoRepository.delete(p);
                });
        seriesRepository.findAll().stream()
                .filter(s -> s.getMember().getId().equals(id))
                .forEach(seriesRepository::delete);
        memberRepository.delete(m);
    }
}

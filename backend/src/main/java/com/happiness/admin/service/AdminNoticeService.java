package com.happiness.admin.service;

import com.happiness.admin.dto.AdminNoticeDto;
import com.happiness.admin.dto.NoticeRequest;
import com.happiness.admin.dto.PageResponse;
import com.happiness.admin.entity.Notice;
import com.happiness.admin.repository.NoticeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminNoticeService {

    private final NoticeRepository noticeRepository;

    public PageResponse<AdminNoticeDto> getNotices(String status, String type, String search, int page, int size) {
        var pageable = PageRequest.of(page, size, Sort.by("isPinned").descending().and(Sort.by("createdAt").descending()));
        return PageResponse.of(noticeRepository.searchNotices(
                (status != null && !status.isBlank()) ? status : null,
                (type != null && !type.isBlank()) ? type : null,
                (search != null && !search.isBlank()) ? search : null,
                pageable
        ).map(AdminNoticeDto::from));
    }

    public AdminNoticeDto getNotice(Long id) {
        return noticeRepository.findById(id)
                .map(AdminNoticeDto::from)
                .orElseThrow(() -> new IllegalArgumentException("공지사항을 찾을 수 없습니다."));
    }

    @Transactional
    public AdminNoticeDto createNotice(NoticeRequest req) {
        Notice notice = Notice.builder()
                .type(req.getType())
                .title(req.getTitle())
                .content(req.getContent())
                .status(req.getStatus())
                .isPinned(req.isPinned())
                .expiresAt(req.getExpiresAt())
                .publishedAt("PUBLISHED".equals(req.getStatus()) ? LocalDateTime.now() : null)
                .build();
        return AdminNoticeDto.from(noticeRepository.save(notice));
    }

    @Transactional
    public AdminNoticeDto updateNotice(Long id, NoticeRequest req) {
        Notice notice = noticeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("공지사항을 찾을 수 없습니다."));
        notice.setType(req.getType());
        notice.setTitle(req.getTitle());
        notice.setContent(req.getContent());
        notice.setPinned(req.isPinned());
        notice.setExpiresAt(req.getExpiresAt());
        if ("PUBLISHED".equals(req.getStatus()) && !"PUBLISHED".equals(notice.getStatus())) {
            notice.setPublishedAt(LocalDateTime.now());
        }
        notice.setStatus(req.getStatus());
        return AdminNoticeDto.from(noticeRepository.save(notice));
    }

    @Transactional
    public void deleteNotice(Long id) {
        if (!noticeRepository.existsById(id)) {
            throw new IllegalArgumentException("공지사항을 찾을 수 없습니다.");
        }
        noticeRepository.deleteById(id);
    }
}

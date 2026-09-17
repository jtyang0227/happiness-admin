package com.happiness.admin.service;

import com.happiness.admin.dto.AdminInquiryDto;
import com.happiness.admin.dto.PageResponse;
import com.happiness.admin.entity.Inquiry;
import com.happiness.admin.entity.InquiryProcessStatus;
import com.happiness.admin.repository.InquiryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminInquiryService {

    private final InquiryRepository inquiryRepository;

    public PageResponse<AdminInquiryDto> getInquiries(Long senderId, Long receiverId, Boolean isRead, String shootType, String processStatus, int page, int size) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        InquiryProcessStatus ps = (processStatus != null && !processStatus.isBlank()) ? InquiryProcessStatus.valueOf(processStatus) : null;
        return PageResponse.of(
                inquiryRepository.searchInquiries(senderId, receiverId, isRead, shootType, ps, pageable)
                        .map(AdminInquiryDto::from));
    }

    @Transactional
    public void markRead(Long id) {
        Inquiry inquiry = inquiryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("문의를 찾을 수 없습니다."));
        inquiry.setRead(true);
        inquiryRepository.save(inquiry);
    }

    @Transactional
    public void updateProcessStatus(Long id, String processStatus) {
        Inquiry inquiry = inquiryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("문의를 찾을 수 없습니다."));
        inquiry.setProcessStatus(InquiryProcessStatus.valueOf(processStatus));
        inquiryRepository.save(inquiry);
    }

    @Transactional
    public int markAllRead() {
        List<Inquiry> unread = inquiryRepository.findAllByIsReadFalse();
        unread.forEach(i -> i.setRead(true));
        inquiryRepository.saveAll(unread);
        return unread.size();
    }

    @Transactional
    public void deleteInquiry(Long id) {
        Inquiry inquiry = inquiryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("문의를 찾을 수 없습니다."));
        inquiryRepository.delete(inquiry);
    }
}

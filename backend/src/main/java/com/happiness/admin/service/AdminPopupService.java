package com.happiness.admin.service;

import com.happiness.admin.dto.AdminPopupDto;
import com.happiness.admin.dto.PopupRequest;
import com.happiness.admin.entity.Popup;
import com.happiness.admin.repository.PopupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminPopupService {

    private final PopupRepository popupRepository;

    public List<AdminPopupDto> getPopups() {
        return popupRepository.findAllByOrderByDisplayOrderAscCreatedAtDesc()
                .stream().map(AdminPopupDto::from).toList();
    }

    public List<AdminPopupDto> getActivePopups(String screen) {
        String target = (screen != null && !screen.isBlank()) ? screen : "HOME";
        return popupRepository.findActive(LocalDateTime.now(), target)
                .stream().map(AdminPopupDto::from).toList();
    }

    @Transactional
    public AdminPopupDto createPopup(PopupRequest req) {
        long nextOrder = popupRepository.count() + 1;
        Popup popup = Popup.builder()
                .title(req.getTitle())
                .content(req.getContent())
                .imageUrl(req.getImageUrl())
                .linkUrl(req.getLinkUrl())
                .targetScreen(req.getTargetScreen() != null ? req.getTargetScreen() : "ALL")
                .isActive(req.isActive())
                .showOnce(req.isShowOnce())
                .displayOrder((int) nextOrder)
                .startsAt(req.getStartsAt())
                .endsAt(req.getEndsAt())
                .build();
        return AdminPopupDto.from(popupRepository.save(popup));
    }

    @Transactional
    public AdminPopupDto updatePopup(Long id, PopupRequest req) {
        Popup popup = popupRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("팝업을 찾을 수 없습니다."));
        popup.setTitle(req.getTitle());
        popup.setContent(req.getContent());
        popup.setImageUrl(req.getImageUrl());
        popup.setLinkUrl(req.getLinkUrl());
        popup.setTargetScreen(req.getTargetScreen() != null ? req.getTargetScreen() : "ALL");
        popup.setActive(req.isActive());
        popup.setShowOnce(req.isShowOnce());
        popup.setStartsAt(req.getStartsAt());
        popup.setEndsAt(req.getEndsAt());
        return AdminPopupDto.from(popupRepository.save(popup));
    }

    @Transactional
    public AdminPopupDto togglePopup(Long id) {
        Popup popup = popupRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("팝업을 찾을 수 없습니다."));
        popup.setActive(!popup.isActive());
        return AdminPopupDto.from(popupRepository.save(popup));
    }

    @Transactional
    public void reorderPopups(List<Long> orderedIds) {
        for (int i = 0; i < orderedIds.size(); i++) {
            final int order = i + 1;
            popupRepository.findById(orderedIds.get(i)).ifPresent(p -> {
                p.setDisplayOrder(order);
                popupRepository.save(p);
            });
        }
    }

    @Transactional
    public void deletePopup(Long id) {
        if (!popupRepository.existsById(id)) {
            throw new IllegalArgumentException("팝업을 찾을 수 없습니다.");
        }
        popupRepository.deleteById(id);
    }
}

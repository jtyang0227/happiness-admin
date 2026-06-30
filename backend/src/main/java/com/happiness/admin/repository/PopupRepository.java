package com.happiness.admin.repository;

import com.happiness.admin.entity.Popup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface PopupRepository extends JpaRepository<Popup, Long> {

    List<Popup> findAllByOrderByDisplayOrderAscCreatedAtDesc();

    // 앱에서 현재 노출 중인 팝업 조회
    @Query("""
        SELECT p FROM Popup p
        WHERE p.isActive = true
          AND (p.startsAt IS NULL OR p.startsAt <= :now)
          AND (p.endsAt IS NULL OR p.endsAt >= :now)
          AND (p.targetScreen = 'ALL' OR p.targetScreen = :screen)
        ORDER BY p.displayOrder ASC, p.createdAt DESC
        """)
    List<Popup> findActive(@Param("now") LocalDateTime now, @Param("screen") String screen);
}

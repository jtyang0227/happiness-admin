package com.happiness.admin.repository;

import com.happiness.admin.entity.PrivacyAccessLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PrivacyAccessLogRepository extends JpaRepository<PrivacyAccessLog, Long> {

    Optional<PrivacyAccessLog> findTopByOrderByIdDesc();

    List<PrivacyAccessLog> findAllByOrderByIdAsc();

    @Query("SELECT l FROM PrivacyAccessLog l WHERE " +
           "(:action IS NULL OR l.action = :action) AND " +
           "(:adminId IS NULL OR l.adminId = :adminId) AND " +
           "(:subjectMemberId IS NULL OR l.subjectMemberId = :subjectMemberId) AND " +
           "l.accessedAt >= :since")
    Page<PrivacyAccessLog> search(@Param("action") String action, @Param("adminId") Long adminId,
                                  @Param("subjectMemberId") Long subjectMemberId,
                                  @Param("since") LocalDateTime since, Pageable pageable);

    long countByActionAndAccessedAtGreaterThanEqual(String action, LocalDateTime since);

    Optional<PrivacyAccessLog> findTopByActionOrderByIdDesc(String action);
}

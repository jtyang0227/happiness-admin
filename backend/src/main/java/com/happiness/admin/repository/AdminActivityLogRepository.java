package com.happiness.admin.repository;

import com.happiness.admin.entity.AdminActivityLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AdminActivityLogRepository extends JpaRepository<AdminActivityLog, Long> {

    @Query("SELECT l FROM AdminActivityLog l WHERE " +
           "(:adminId IS NULL OR l.adminId = :adminId) AND " +
           "(:action IS NULL OR l.action = :action) " +
           "ORDER BY l.createdAt DESC")
    Page<AdminActivityLog> searchLogs(@Param("adminId") Long adminId,
                                      @Param("action") String action,
                                      Pageable pageable);

    @Query("SELECT cast(l.createdAt as LocalDate) as day, COUNT(l) as cnt FROM AdminActivityLog l " +
           "WHERE l.createdAt >= :since GROUP BY cast(l.createdAt as LocalDate) ORDER BY day")
    List<Object[]> dailyActivity(@Param("since") LocalDateTime since);
}

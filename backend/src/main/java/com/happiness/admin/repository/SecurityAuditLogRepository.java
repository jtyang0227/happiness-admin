package com.happiness.admin.repository;

import com.happiness.admin.entity.SecurityAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SecurityAuditLogRepository extends JpaRepository<SecurityAuditLog, Long> {

    @Query("SELECT l FROM SecurityAuditLog l WHERE " +
           "(:actionType IS NULL OR l.actionType = :actionType) AND " +
           "(:success IS NULL OR l.success = :success) AND " +
           "(:memberId IS NULL OR l.memberId = :memberId) AND " +
           "(:ip IS NULL OR l.ipAddress = :ip) AND " +
           "l.createdAt >= :since")
    Page<SecurityAuditLog> search(@Param("actionType") String actionType,
                                  @Param("success") Boolean success,
                                  @Param("memberId") Long memberId,
                                  @Param("ip") String ip,
                                  @Param("since") LocalDateTime since,
                                  Pageable pageable);

    long countByActionTypeAndCreatedAtGreaterThanEqual(String actionType, LocalDateTime since);

    @Query("SELECT l.ipAddress, COUNT(l), MAX(l.createdAt) FROM SecurityAuditLog l " +
           "WHERE l.actionType = 'LOGIN_FAILURE' AND l.createdAt >= :since AND l.ipAddress IS NOT NULL " +
           "GROUP BY l.ipAddress ORDER BY COUNT(l) DESC")
    List<Object[]> topLoginFailureIps(@Param("since") LocalDateTime since, Pageable pageable);
}

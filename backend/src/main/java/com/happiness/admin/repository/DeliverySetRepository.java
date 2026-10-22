package com.happiness.admin.repository;

import com.happiness.admin.entity.DeliverySet;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DeliverySetRepository extends JpaRepository<DeliverySet, Long> {

    @Query("SELECT d FROM DeliverySet d WHERE (:status IS NULL OR d.status = :status)")
    Page<DeliverySet> findByStatusOrAll(@Param("status") String status, Pageable pageable);

    @Query("SELECT d.status, COUNT(d) FROM DeliverySet d GROUP BY d.status")
    List<Object[]> countByStatus();

    /** 고객 승인 대기인데 만료가 지났거나 :soon 이전에 만료되는 세트 */
    @Query("SELECT d FROM DeliverySet d WHERE (d.status IS NULL OR d.status = 'PENDING') AND d.expiresAt < :soon ORDER BY d.expiresAt ASC")
    List<DeliverySet> findExpiringPending(@Param("soon") LocalDateTime soon, Pageable pageable);
}

package com.happiness.admin.repository;

import com.happiness.admin.entity.Meet;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MeetRepository extends JpaRepository<Meet, Long> {

    @Query("SELECT m FROM Meet m WHERE (:status IS NULL OR m.status = :status)")
    Page<Meet> findByStatusOrAll(@Param("status") String status, Pageable pageable);

    @Query("SELECT m.status, COUNT(m) FROM Meet m GROUP BY m.status")
    List<Object[]> countByStatus();

    @Query("SELECT m FROM Meet m WHERE m.status IN ('PENDING', 'NEGOTIATING') AND m.updatedAt < :before ORDER BY m.updatedAt ASC")
    List<Meet> findStalled(@Param("before") LocalDateTime before, Pageable pageable);
}

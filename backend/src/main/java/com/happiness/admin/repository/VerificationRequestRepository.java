package com.happiness.admin.repository;

import com.happiness.admin.entity.VerificationRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface VerificationRequestRepository extends JpaRepository<VerificationRequest, Long> {

    @Query("SELECT v FROM VerificationRequest v WHERE " +
           "(:status IS NULL OR v.status = :status)")
    Page<VerificationRequest> searchVerifications(@Param("status") String status, Pageable pageable);

    long countByStatus(String status);
}

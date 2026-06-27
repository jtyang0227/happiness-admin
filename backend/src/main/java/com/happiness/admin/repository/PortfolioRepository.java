package com.happiness.admin.repository;

import com.happiness.admin.entity.Portfolio;
import com.happiness.admin.entity.PortfolioStatus;
import com.happiness.admin.entity.PortfolioVisibility;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PortfolioRepository extends JpaRepository<Portfolio, Long> {

    @Query("SELECT p FROM Portfolio p WHERE " +
           "(:status IS NULL OR p.status = :status) AND " +
           "(:visibility IS NULL OR p.visibility = :visibility) AND " +
           "(:search IS NULL OR LOWER(p.title) LIKE LOWER(CONCAT('%',:search,'%')) " +
           " OR LOWER(p.member.name) LIKE LOWER(CONCAT('%',:search,'%')))")
    Page<Portfolio> searchPortfolios(
            @Param("status") PortfolioStatus status,
            @Param("visibility") PortfolioVisibility visibility,
            @Param("search") String search,
            Pageable pageable);

    long countByStatus(PortfolioStatus status);

    long countByMemberId(Long memberId);
}

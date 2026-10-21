package com.happiness.admin.repository;

import com.happiness.admin.entity.PricingPackage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PricingPackageRepository extends JpaRepository<PricingPackage, Long> {

    @Query("SELECT x FROM PricingPackage x WHERE (:memberId IS NULL OR x.memberId = :memberId)")
    Page<PricingPackage> findByMember(@Param("memberId") Long memberId, Pageable pageable);
}

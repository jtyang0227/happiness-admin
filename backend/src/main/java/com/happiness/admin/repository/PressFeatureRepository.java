package com.happiness.admin.repository;

import com.happiness.admin.entity.PressFeature;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PressFeatureRepository extends JpaRepository<PressFeature, Long> {

    @Query("SELECT x FROM PressFeature x WHERE (:memberId IS NULL OR x.memberId = :memberId)")
    Page<PressFeature> findByMember(@Param("memberId") Long memberId, Pageable pageable);
}

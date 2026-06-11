package com.happiness.admin.repository;

import com.happiness.admin.entity.Series;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SeriesRepository extends JpaRepository<Series, Long> {

    @Query("SELECT s FROM Series s WHERE (:memberId IS NULL OR s.member.id = :memberId)")
    Page<Series> searchSeries(@Param("memberId") Long memberId, Pageable pageable);

    long countByMemberId(Long memberId);
}

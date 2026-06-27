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

    @Query("SELECT s FROM Series s WHERE " +
           "(:memberId IS NULL OR s.member.id = :memberId) AND " +
           "(:search IS NULL OR LOWER(s.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(s.member.name) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Series> searchSeries(@Param("memberId") Long memberId,
                              @Param("search") String search,
                              Pageable pageable);

    long countByMemberId(Long memberId);

    @Query("SELECT s FROM Series s ORDER BY CASE WHEN s.displayOrder = 0 THEN 1 ELSE 0 END ASC, s.displayOrder ASC, s.createdAt DESC, s.id DESC")
    java.util.List<Series> findAllOrderedForSort();
}

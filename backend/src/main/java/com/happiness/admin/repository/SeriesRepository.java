package com.happiness.admin.repository;

import com.happiness.admin.entity.Series;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SeriesRepository extends JpaRepository<Series, Long> {

    @Query("SELECT s FROM Series s LEFT JOIN FETCH s.member m WHERE " +
           "(:memberId IS NULL OR m.id = :memberId) AND " +
           "(:search IS NULL OR LOWER(s.title) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(m.name) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Series> searchSeries(@Param("memberId") Long memberId,
                              @Param("search") String search,
                              Pageable pageable);

    long countByMemberId(Long memberId);

    @Query("SELECT s.member.id, COUNT(s) FROM Series s WHERE s.member.id IN :memberIds GROUP BY s.member.id")
    List<Object[]> countByMemberIdIn(@Param("memberIds") List<Long> memberIds);

    List<Series> findByMemberId(Long memberId);

    @Query("SELECT s FROM Series s LEFT JOIN FETCH s.member ORDER BY CASE WHEN s.displayOrder = 0 THEN 1 ELSE 0 END ASC, s.displayOrder ASC, s.createdAt DESC, s.id DESC")
    List<Series> findAllOrderedForSort();
}

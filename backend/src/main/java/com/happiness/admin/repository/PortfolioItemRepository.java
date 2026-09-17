package com.happiness.admin.repository;

import com.happiness.admin.entity.PortfolioItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PortfolioItemRepository extends JpaRepository<PortfolioItem, Long> {

    @Query("SELECT pi FROM PortfolioItem pi WHERE pi.portfolio.id = :portfolioId ORDER BY pi.displayOrder ASC, pi.id ASC")
    List<PortfolioItem> findByPortfolioIdOrdered(@Param("portfolioId") Long portfolioId);

    @Query("SELECT pi.portfolio.id, pi.itemType, COUNT(pi) FROM PortfolioItem pi " +
           "WHERE pi.portfolio.id IN :portfolioIds GROUP BY pi.portfolio.id, pi.itemType")
    List<Object[]> countByPortfolioIdInGroupByType(@Param("portfolioIds") List<Long> portfolioIds);
}

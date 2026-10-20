package com.happiness.admin.repository;

import com.happiness.admin.entity.Gathering;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GatheringRepository extends JpaRepository<Gathering, Long> {

    @Query("SELECT g FROM Gathering g WHERE " +
           "(:status IS NULL OR g.status = :status) AND " +
           "(:search IS NULL OR LOWER(g.title) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(g.location) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Gathering> search(@Param("status") String status, @Param("search") String search, Pageable pageable);

    @Query("SELECT g.status, COUNT(g) FROM Gathering g GROUP BY g.status")
    List<Object[]> countByStatus();
}

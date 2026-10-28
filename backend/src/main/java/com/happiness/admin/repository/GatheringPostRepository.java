package com.happiness.admin.repository;

import com.happiness.admin.entity.GatheringPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GatheringPostRepository extends JpaRepository<GatheringPost, Long> {

    List<GatheringPost> findByGatheringIdOrderByCreatedAtDesc(Long gatheringId);

    @Query("SELECT p.gatheringId, COUNT(p) FROM GatheringPost p WHERE p.gatheringId IN :ids GROUP BY p.gatheringId")
    List<Object[]> countByGatheringIdIn(@Param("ids") List<Long> ids);
}

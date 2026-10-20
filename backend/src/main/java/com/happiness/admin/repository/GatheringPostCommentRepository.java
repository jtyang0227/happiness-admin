package com.happiness.admin.repository;

import com.happiness.admin.entity.GatheringPostComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GatheringPostCommentRepository extends JpaRepository<GatheringPostComment, Long> {

    @Query("SELECT x.gatheringPostId, COUNT(x) FROM GatheringPostComment x WHERE x.gatheringPostId IN :postIds GROUP BY x.gatheringPostId")
    List<Object[]> countByGatheringPostIdIn(@Param("postIds") List<Long> postIds);

    @Modifying
    @Query("DELETE FROM GatheringPostComment x WHERE x.gatheringPostId = :postId")
    int deleteByGatheringPostId(@Param("postId") Long postId);
}

package com.happiness.admin.repository;

import com.happiness.admin.entity.GatheringPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GatheringPhotoRepository extends JpaRepository<GatheringPhoto, Long> {

    List<GatheringPhoto> findByGatheringPostIdInOrderBySortOrderAsc(List<Long> postIds);

    @Modifying
    @Query("DELETE FROM GatheringPhoto p WHERE p.gatheringPostId = :postId")
    int deleteByGatheringPostId(@Param("postId") Long postId);
}

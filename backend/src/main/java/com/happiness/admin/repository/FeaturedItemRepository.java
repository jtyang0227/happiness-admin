package com.happiness.admin.repository;

import com.happiness.admin.entity.FeaturedItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeaturedItemRepository extends JpaRepository<FeaturedItem, Long> {
    List<FeaturedItem> findAllByOrderByDisplayOrderAsc();
    boolean existsByPhotoId(Long photoId);
    long count();

    @Modifying
    @Query("DELETE FROM FeaturedItem f WHERE f.photo.id IN :photoIds")
    int deleteByPhotoIdIn(@Param("photoIds") List<Long> photoIds);
}

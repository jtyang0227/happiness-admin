package com.happiness.admin.repository;

import com.happiness.admin.entity.FeaturedItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeaturedItemRepository extends JpaRepository<FeaturedItem, Long> {
    List<FeaturedItem> findAllByOrderByDisplayOrderAsc();
    boolean existsByPhotoId(Long photoId);
    long count();
}

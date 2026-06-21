package com.happiness.admin.repository;

import com.happiness.admin.entity.PhotoCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PhotoCategoryRepository extends JpaRepository<PhotoCategory, Long> {
    List<PhotoCategory> findByLevelAndActiveOrderBySortOrder(int level, boolean active);
    List<PhotoCategory> findByActiveOrderByLevelAscSortOrderAsc(boolean active);
}

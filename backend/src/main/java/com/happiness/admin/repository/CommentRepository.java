package com.happiness.admin.repository;

import com.happiness.admin.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

    @Query("SELECT c FROM Comment c WHERE " +
           "(:photoId IS NULL OR c.photoId = :photoId) AND " +
           "(:search IS NULL OR LOWER(c.content) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(c.memberName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Comment> search(@Param("photoId") Long photoId, @Param("search") String search, Pageable pageable);

    @Query("SELECT c.parentId, COUNT(c) FROM Comment c WHERE c.parentId IN :parentIds GROUP BY c.parentId")
    List<Object[]> countRepliesByParentIdIn(@Param("parentIds") List<Long> parentIds);

    List<Comment> findByParentId(Long parentId);

    long countByCreatedAtGreaterThanEqual(LocalDateTime since);
}

package com.happiness.admin.repository;

import com.happiness.admin.entity.Photo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PhotoRepository extends JpaRepository<Photo, Long> {

    @Query("SELECT p FROM Photo p WHERE " +
           "(:memberId IS NULL OR p.member.id = :memberId) AND " +
           "(:colorMood IS NULL OR p.colorMood = :colorMood) AND " +
           "(:search IS NULL OR " +
           "  LOWER(p.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "  LOWER(p.member.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "  LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "  LOWER(p.member.profileName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Photo> searchPhotos(@Param("memberId") Long memberId,
                             @Param("colorMood") String colorMood,
                             @Param("search") String search,
                             Pageable pageable);

    List<Photo> findTop5ByOrderByLikesCountDesc();

    @Query("SELECT p FROM Photo p ORDER BY p.likesCount DESC")
    List<Photo> findTopByLikes(Pageable pageable);

    @Query("SELECT p FROM Photo p ORDER BY p.savesCount DESC")
    List<Photo> findTopBySaves(Pageable pageable);

    @Query("SELECT p FROM Photo p ORDER BY p.sharesCount DESC")
    List<Photo> findTopByShares(Pageable pageable);

    @Query("SELECT p.colorMood, COUNT(p) FROM Photo p WHERE p.colorMood IS NOT NULL GROUP BY p.colorMood ORDER BY COUNT(p) DESC")
    List<Object[]> moodDistribution();

    @Query("SELECT COUNT(p) FROM Photo p WHERE p.createdAt >= :since")
    long countSince(@Param("since") LocalDateTime since);

    @Query("SELECT cast(p.createdAt as LocalDate) as day, COUNT(p) as cnt FROM Photo p " +
           "WHERE p.createdAt >= :since GROUP BY cast(p.createdAt as LocalDate) ORDER BY day")
    List<Object[]> dailyUploads(@Param("since") LocalDateTime since);

    @Modifying
    @Query("DELETE FROM SeriesPhoto sp WHERE sp.photo.id = :photoId")
    void deleteSeriesPhotosByPhotoId(@Param("photoId") Long photoId);

    long countByMemberId(Long memberId);

    List<Photo> findByMemberId(Long memberId);
}

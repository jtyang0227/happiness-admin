package com.happiness.admin.repository;

import com.happiness.admin.entity.SeriesPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SeriesPhotoRepository extends JpaRepository<SeriesPhoto, Long> {

    @Query("SELECT sp FROM SeriesPhoto sp WHERE sp.series.id = :seriesId ORDER BY sp.displayOrder ASC, sp.id ASC")
    java.util.List<SeriesPhoto> findBySeriesIdOrdered(@Param("seriesId") Long seriesId);

    @Modifying
    @Query("DELETE FROM SeriesPhoto sp WHERE sp.photo.id = :photoId")
    void deleteByPhotoId(@Param("photoId") Long photoId);
}

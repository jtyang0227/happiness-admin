package com.happiness.admin.dto;

import com.happiness.admin.entity.SeriesPhoto;
import lombok.Data;

@Data
public class SortSeriesPhotoDto {
    private Long id;
    private Long photoId;
    private String title;
    private String thumbnailUrl;
    private int displayOrder;

    public static SortSeriesPhotoDto from(SeriesPhoto sp) {
        SortSeriesPhotoDto d = new SortSeriesPhotoDto();
        d.id = sp.getId();
        d.photoId = sp.getPhoto() != null ? sp.getPhoto().getId() : null;
        d.title = sp.getPhoto() != null ? sp.getPhoto().getTitle() : null;
        d.thumbnailUrl = sp.getPhoto() != null ? sp.getPhoto().getThumbnailUrl() : null;
        d.displayOrder = sp.getDisplayOrder();
        return d;
    }
}

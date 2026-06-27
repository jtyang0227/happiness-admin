package com.happiness.admin.dto;

import com.happiness.admin.entity.Series;
import lombok.Data;

@Data
public class SortSeriesDto {
    private Long id;
    private String title;
    private String coverImageUrl;
    private int displayOrder;
    private String memberName;
    private int photoCount;

    public static SortSeriesDto from(Series s) {
        SortSeriesDto d = new SortSeriesDto();
        d.id = s.getId();
        d.title = s.getTitle();
        d.coverImageUrl = s.getCoverImageUrl();
        d.displayOrder = s.getDisplayOrder();
        d.memberName = s.getMember() != null ? s.getMember().getName() : null;
        d.photoCount = s.getSeriesPhotos() != null ? s.getSeriesPhotos().size() : 0;
        return d;
    }
}

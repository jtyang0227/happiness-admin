package com.happiness.admin.dto;

import com.happiness.admin.entity.PortfolioItem;
import lombok.Data;

@Data
public class SortPortfolioItemDto {
    private Long id;
    private String itemType;
    private String title;
    private String thumbnailUrl;
    private int displayOrder;
    private boolean featured;

    public static SortPortfolioItemDto from(PortfolioItem pi) {
        SortPortfolioItemDto d = new SortPortfolioItemDto();
        d.id = pi.getId();
        d.itemType = pi.getItemType();
        d.displayOrder = pi.getDisplayOrder();
        d.featured = pi.isFeatured();
        if ("PHOTO".equals(pi.getItemType()) && pi.getPhoto() != null) {
            d.title = pi.getPhoto().getTitle();
            d.thumbnailUrl = pi.getPhoto().getThumbnailUrl();
        } else if ("SERIES".equals(pi.getItemType()) && pi.getSeries() != null) {
            d.title = pi.getSeries().getTitle();
            d.thumbnailUrl = pi.getSeries().getCoverImageUrl();
        }
        return d;
    }
}

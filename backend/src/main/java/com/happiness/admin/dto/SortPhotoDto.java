package com.happiness.admin.dto;

import com.happiness.admin.entity.Photo;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SortPhotoDto {
    private Long id;
    private String title;
    private String thumbnailUrl;
    private int displayOrder;
    private String memberName;
    private LocalDateTime createdAt;

    public static SortPhotoDto from(Photo p) {
        SortPhotoDto d = new SortPhotoDto();
        d.id = p.getId();
        d.title = p.getTitle();
        d.thumbnailUrl = p.getThumbnailUrl();
        d.displayOrder = p.getDisplayOrder();
        d.memberName = p.getMember() != null ? p.getMember().getName() : null;
        d.createdAt = p.getCreatedAt();
        return d;
    }
}

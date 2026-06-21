package com.happiness.admin.dto;

import com.happiness.admin.entity.PhotoCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CategoryDto {
    private int level;
    private String code;
    private String nameKo;
    private String nameEn;
    private int sortOrder;

    public static CategoryDto from(PhotoCategory c) {
        return CategoryDto.builder()
                .level(c.getLevel()).code(c.getCode())
                .nameKo(c.getNameKo()).nameEn(c.getNameEn())
                .sortOrder(c.getSortOrder())
                .build();
    }
}

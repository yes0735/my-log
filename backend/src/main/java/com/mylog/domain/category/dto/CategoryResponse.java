package com.mylog.domain.category.dto;

import com.mylog.domain.category.entity.Category;
import lombok.*;

@Getter @Builder @AllArgsConstructor
public class CategoryResponse {
    private Long id;
    private String name;
    private String color;

    public static CategoryResponse from(Category c) {
        return CategoryResponse.builder()
                .id(c.getId()).name(c.getName()).color(c.getColor()).build();
    }
}

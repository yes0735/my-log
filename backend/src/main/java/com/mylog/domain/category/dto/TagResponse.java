package com.mylog.domain.category.dto;

import com.mylog.domain.category.entity.Tag;
import lombok.*;

@Getter @Builder @AllArgsConstructor
public class TagResponse {
    private Long id;
    private String name;

    public static TagResponse from(Tag t) {
        return TagResponse.builder().id(t.getId()).name(t.getName()).build();
    }
}

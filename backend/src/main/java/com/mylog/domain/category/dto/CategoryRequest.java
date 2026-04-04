package com.mylog.domain.category.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class CategoryRequest {
    @NotBlank @Size(max = 50)
    private String name;
    private String color;
}

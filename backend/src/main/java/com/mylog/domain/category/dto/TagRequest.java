package com.mylog.domain.category.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class TagRequest {
    @NotBlank @Size(max = 30)
    private String name;
}

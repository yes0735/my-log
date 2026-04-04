package com.mylog.domain.review.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class ReviewCreateRequest {
    @NotBlank(message = "제목은 필수입니다")
    private String title;

    @NotBlank(message = "내용은 필수입니다")
    private String content;

    private Boolean isPublic;
}

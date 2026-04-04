package com.mylog.domain.highlight.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class HighlightRequest {
    private Integer pageNumber;

    @NotBlank(message = "하이라이트 내용은 필수입니다")
    private String content;

    private String memo;
}

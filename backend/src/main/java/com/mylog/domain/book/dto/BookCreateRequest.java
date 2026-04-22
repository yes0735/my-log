package com.mylog.domain.book.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class BookCreateRequest {
    private String isbn;
    @NotBlank(message = "제목은 필수입니다")
    private String title;
    @NotBlank(message = "저자는 필수입니다")
    private String author;
    private String publisher;
    private String coverImageUrl;
    private Integer totalPages;
    private String description;
    private String publishedDate;
    private String originalCategory;
}

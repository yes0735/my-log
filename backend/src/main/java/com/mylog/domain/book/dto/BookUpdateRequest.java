package com.mylog.domain.book.dto;

import lombok.Getter;

@Getter
public class BookUpdateRequest {
    private String title;
    private String author;
    private String publisher;
    private Integer totalPages;
    private String description;
}

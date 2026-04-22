package com.mylog.infra.booksearch;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BookSearchResult {
    private String isbn;
    private String title;
    private String author;
    private String publisher;
    private String coverImageUrl;
    private Integer totalPages;
    private String description;
    private String publishedDate;
    // 알라딘 categoryName (계층형 경로, e.g. "국내도서>소설>한국소설")
    private String originalCategory;
}

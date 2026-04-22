package com.mylog.domain.book.dto;

import com.mylog.domain.book.entity.Book;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class BookResponse {
    private Long id;
    private String isbn;
    private String title;
    private String author;
    private String publisher;
    private String coverImageUrl;
    private Integer totalPages;
    private String description;
    private String publishedDate;
    private String originalCategory;

    public static BookResponse from(Book book) {
        return BookResponse.builder()
                .id(book.getId())
                .isbn(book.getIsbn())
                .title(book.getTitle())
                .author(book.getAuthor())
                .publisher(book.getPublisher())
                .coverImageUrl(book.getCoverImageUrl())
                .totalPages(book.getTotalPages())
                .description(book.getDescription())
                .publishedDate(book.getPublishedDate() != null ? book.getPublishedDate().toString() : null)
                .originalCategory(book.getOriginalCategory())
                .build();
    }
}

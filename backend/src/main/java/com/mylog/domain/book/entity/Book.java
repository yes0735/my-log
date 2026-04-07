package com.mylog.domain.book.entity;

import com.mylog.global.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

// Design Ref: §3.1 — Book entity
@Entity
@Table(name = "books")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Book extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 13, unique = true)
    private String isbn;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(nullable = false)
    private String author;

    private String publisher;

    @Column(name = "cover_image_url", length = 500)
    private String coverImageUrl;

    @Column(name = "total_pages")
    private Integer totalPages;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "published_date")
    private LocalDate publishedDate;

    @Column(name = "created_by_user_id")
    private Long createdByUserId;

    public void update(String title, String author, String publisher, Integer totalPages, String description) {
        if (title != null) this.title = title;
        if (author != null) this.author = author;
        if (publisher != null) this.publisher = publisher;
        if (totalPages != null) this.totalPages = totalPages;
        if (description != null) this.description = description;
    }
}

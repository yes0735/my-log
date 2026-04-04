package com.mylog.domain.category.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "book_categories", uniqueConstraints = @UniqueConstraint(columnNames = {"user_book_id", "category_id"}))
@Getter @Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor @Builder
public class BookCategory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_book_id", nullable = false)
    private Long userBookId;

    @Column(name = "category_id", nullable = false)
    private Long categoryId;
}

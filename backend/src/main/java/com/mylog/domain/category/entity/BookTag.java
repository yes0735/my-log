package com.mylog.domain.category.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "book_tags", uniqueConstraints = @UniqueConstraint(columnNames = {"user_book_id", "tag_id"}))
@Getter @Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor @Builder
public class BookTag {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_book_id", nullable = false)
    private Long userBookId;

    @Column(name = "tag_id", nullable = false)
    private Long tagId;
}

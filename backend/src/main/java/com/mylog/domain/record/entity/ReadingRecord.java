package com.mylog.domain.record.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

// Design Ref: §3.1 — ReadingRecord entity
@Entity
@Table(name = "reading_records")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ReadingRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_book_id", nullable = false)
    private Long userBookId;

    @Column(name = "read_date", nullable = false)
    private LocalDate readDate;

    @Column(name = "pages_read", nullable = false)
    private Integer pagesRead;

    @Column(name = "from_page")
    private Integer fromPage;

    @Column(name = "to_page")
    private Integer toPage;

    @Column(columnDefinition = "TEXT")
    private String memo;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}

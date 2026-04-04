package com.mylog.domain.stats.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class StatsSummary {
    private long totalBooks;
    private long completedBooks;
    private long readingBooks;
    private long wantToReadBooks;
    private long totalPagesRead;
    private long totalRecords;
    private double averageRating;
}

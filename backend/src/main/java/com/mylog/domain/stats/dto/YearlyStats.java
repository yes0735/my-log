package com.mylog.domain.stats.dto;

import lombok.*;

@Getter
@Builder
@AllArgsConstructor
public class YearlyStats {
    private long totalBooks;
    private long completedBooks;
    private long totalPagesRead;
    private double averageRating;
}

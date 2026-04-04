package com.mylog.domain.stats.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class MonthlyStats {
    private int month;
    private long booksCompleted;
    private long pagesRead;
    private long recordCount;
}

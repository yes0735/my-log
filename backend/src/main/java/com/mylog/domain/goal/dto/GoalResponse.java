package com.mylog.domain.goal.dto;

import com.mylog.domain.goal.entity.ReadingGoal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class GoalResponse {
    private Long id;
    private Integer targetYear;
    private Integer targetMonth;
    private Integer targetBooks;
    private Integer completedBooks;
    private int progressPercent;

    public static GoalResponse from(ReadingGoal g) {
        int progress = g.getTargetBooks() > 0
                ? Math.min(100, (int) Math.round((double) g.getCompletedBooks() / g.getTargetBooks() * 100))
                : 0;
        return GoalResponse.builder()
                .id(g.getId())
                .targetYear(g.getTargetYear())
                .targetMonth(g.getTargetMonth())
                .targetBooks(g.getTargetBooks())
                .completedBooks(g.getCompletedBooks())
                .progressPercent(progress)
                .build();
    }
}

package com.mylog.domain.goal.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;

@Getter
public class GoalRequest {
    @NotNull(message = "목표 연도는 필수입니다")
    private Integer targetYear;
    private Integer targetMonth;
    @NotNull(message = "목표 권수는 필수입니다")
    @Positive(message = "목표 권수는 1 이상이어야 합니다")
    private Integer targetBooks;
}

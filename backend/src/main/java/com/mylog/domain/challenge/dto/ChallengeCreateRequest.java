package com.mylog.domain.challenge.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChallengeCreateRequest {

    @NotBlank(message = "챌린지 제목은 필수입니다")
    private String title;

    private String description;

    @Min(value = 1, message = "목표 권수는 1 이상이어야 합니다")
    private Integer targetBooks;

    private LocalDate startDate;

    private LocalDate endDate;
}

package com.mylog.domain.gamification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class LevelResponse {
    private Integer level;
    private Integer totalXp;
    private Integer currentLevelXp;
    private Integer nextLevelXp;
    private Integer progressPercent;
}

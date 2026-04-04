package com.mylog.domain.gamification.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BadgeResponse {
    private Long id;
    private String code;
    private String name;
    private String description;
    private String iconUrl;
    private Integer xpReward;
    private Boolean earned;
    private LocalDateTime earnedAt;
}

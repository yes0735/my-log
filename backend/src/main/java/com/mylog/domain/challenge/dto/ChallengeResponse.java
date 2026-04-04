package com.mylog.domain.challenge.dto;

import com.mylog.domain.challenge.entity.Challenge;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class ChallengeResponse {

    private Long id;
    private String title;
    private String description;
    private Long creatorId;
    private String creatorNickname;
    private Integer targetBooks;
    private LocalDate startDate;
    private LocalDate endDate;
    private long participantCount;
    private Boolean isJoined;
    private LocalDateTime createdAt;

    public static ChallengeResponse from(Challenge c, String nickname, long count, boolean isJoined) {
        return ChallengeResponse.builder()
                .id(c.getId())
                .title(c.getTitle())
                .description(c.getDescription())
                .creatorId(c.getCreatorId())
                .creatorNickname(nickname)
                .targetBooks(c.getTargetBooks())
                .startDate(c.getStartDate())
                .endDate(c.getEndDate())
                .participantCount(count)
                .isJoined(isJoined)
                .createdAt(c.getCreatedAt())
                .build();
    }
}

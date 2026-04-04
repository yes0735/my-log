package com.mylog.domain.challenge.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class ParticipantResponse {

    private Long userId;
    private String nickname;
    private String profileImageUrl;
    private Integer completedBooks;
    private LocalDateTime joinedAt;
}

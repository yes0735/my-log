package com.mylog.domain.gamification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class LeaderboardEntry {

    private int rank;
    private Long userId;
    private String nickname;
    private String profileImageUrl;
    private int completedBooks;
    private int pagesRead;
}

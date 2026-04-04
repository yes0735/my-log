package com.mylog.domain.follow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class UserProfileResponse {

    private Long id;
    private String nickname;
    private String profileImageUrl;
    private Stats stats;
    private Boolean isFollowing;

    @Getter
    @Builder
    @AllArgsConstructor
    public static class Stats {
        private long totalBooks;
        private long completedBooks;
        private long followerCount;
        private long followingCount;
    }
}

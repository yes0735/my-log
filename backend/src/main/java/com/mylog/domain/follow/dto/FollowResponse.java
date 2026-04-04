package com.mylog.domain.follow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class FollowResponse {

    private Long userId;
    private String nickname;
    private String profileImageUrl;
    private LocalDateTime followedAt;
}

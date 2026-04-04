package com.mylog.domain.group.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class GroupMemberResponse {

    private Long userId;
    private String nickname;
    private String profileImageUrl;
    private String role;
    private LocalDateTime joinedAt;
}

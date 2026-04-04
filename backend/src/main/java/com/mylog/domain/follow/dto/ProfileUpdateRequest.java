package com.mylog.domain.follow.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ProfileUpdateRequest {

    @Size(min = 1, max = 50, message = "닉네임은 1~50자 이내여야 합니다")
    private String nickname;

    @Size(max = 500, message = "프로필 이미지 URL은 500자 이내여야 합니다")
    private String profileImageUrl;
}

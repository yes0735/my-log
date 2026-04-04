package com.mylog.domain.follow.controller;

import com.mylog.domain.follow.dto.FollowResponse;
import com.mylog.domain.follow.dto.ProfileUpdateRequest;
import com.mylog.domain.follow.dto.UserProfileResponse;
import com.mylog.domain.follow.service.FollowService;
import com.mylog.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Follow", description = "팔로우 및 프로필 API")
@RestController
@RequiredArgsConstructor
public class FollowController {

    private final FollowService followService;

    @Operation(summary = "사용자 프로필 조회")
    @GetMapping("/api/v1/users/{id}/profile")
    public ApiResponse<UserProfileResponse> getProfile(
            @PathVariable Long id,
            Authentication auth) {
        Long viewerId = auth != null ? (Long) auth.getPrincipal() : null;
        return ApiResponse.ok(followService.getProfile(id, viewerId));
    }

    @Operation(summary = "내 프로필 수정")
    @PutMapping("/api/v1/my/profile")
    public ApiResponse<UserProfileResponse> updateProfile(
            Authentication auth,
            @Valid @RequestBody ProfileUpdateRequest request) {
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.ok(followService.updateProfile(userId, request));
    }

    @Operation(summary = "팔로우")
    @PostMapping("/api/v1/users/{id}/follow")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Void> follow(
            Authentication auth,
            @PathVariable Long id) {
        Long userId = (Long) auth.getPrincipal();
        followService.follow(userId, id);
        return ApiResponse.ok(null);
    }

    @Operation(summary = "언팔로우")
    @DeleteMapping("/api/v1/users/{id}/follow")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unfollow(
            Authentication auth,
            @PathVariable Long id) {
        Long userId = (Long) auth.getPrincipal();
        followService.unfollow(userId, id);
    }

    @Operation(summary = "팔로워 목록 조회")
    @GetMapping("/api/v1/users/{id}/followers")
    public ApiResponse<Page<FollowResponse>> getFollowers(
            @PathVariable Long id,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.ok(followService.getFollowers(id, pageable));
    }

    @Operation(summary = "팔로잉 목록 조회")
    @GetMapping("/api/v1/users/{id}/following")
    public ApiResponse<Page<FollowResponse>> getFollowing(
            @PathVariable Long id,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.ok(followService.getFollowing(id, pageable));
    }
}

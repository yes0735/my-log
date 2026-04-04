package com.mylog.domain.gamification.controller;

import com.mylog.domain.gamification.dto.BadgeResponse;
import com.mylog.domain.gamification.service.BadgeService;
import com.mylog.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Gamification", description = "게이미피케이션 API")
@RestController
@RequiredArgsConstructor
public class BadgeController {

    private final BadgeService badgeService;

    @Operation(summary = "내 뱃지 목록")
    @GetMapping("/api/v1/my/badges")
    public ApiResponse<List<BadgeResponse>> getMyBadges(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.ok(badgeService.getMyBadges(userId));
    }

    @Operation(summary = "전체 뱃지 목록 (획득 여부 포함)")
    @GetMapping("/api/v1/badges")
    public ApiResponse<List<BadgeResponse>> getAllBadges(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.ok(badgeService.getAllBadges(userId));
    }
}

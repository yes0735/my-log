package com.mylog.domain.gamification.controller;

import com.mylog.domain.gamification.dto.LevelResponse;
import com.mylog.domain.gamification.service.LevelService;
import com.mylog.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Gamification", description = "게이미피케이션 API")
@RestController
@RequiredArgsConstructor
public class LevelController {

    private final LevelService levelService;

    @Operation(summary = "내 레벨/XP 조회")
    @GetMapping("/api/v1/my/level")
    public ApiResponse<LevelResponse> getLevel(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.ok(levelService.getLevel(userId));
    }
}

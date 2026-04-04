package com.mylog.domain.gamification.controller;

import com.mylog.domain.gamification.dto.LeaderboardEntry;
import com.mylog.domain.gamification.service.LeaderboardService;
import com.mylog.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Leaderboard", description = "리더보드 API")
@RestController
@RequiredArgsConstructor
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    @Operation(summary = "리더보드 조회")
    @GetMapping("/api/v1/leaderboard")
    public ApiResponse<List<LeaderboardEntry>> getLeaderboard(
            @RequestParam(defaultValue = "week") String period) {
        return ApiResponse.ok(leaderboardService.getLeaderboard(period));
    }
}

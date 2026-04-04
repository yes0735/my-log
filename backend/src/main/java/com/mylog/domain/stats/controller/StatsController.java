package com.mylog.domain.stats.controller;

import com.mylog.domain.stats.dto.GenreStats;
import com.mylog.domain.stats.dto.MonthlyStats;
import com.mylog.domain.stats.dto.StatsSummary;
import com.mylog.domain.stats.dto.YearlyStats;
import com.mylog.domain.stats.service.StatsService;
import com.mylog.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Year;
import java.util.List;

@Tag(name = "Stats", description = "독서 통계 API")
@RestController
@RequestMapping("/api/v1/my/stats")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;

    @Operation(summary = "전체 통계 요약")
    @GetMapping("/summary")
    public ApiResponse<StatsSummary> getSummary(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.ok(statsService.getSummary(userId));
    }

    @Operation(summary = "월별 독서량")
    @GetMapping("/monthly")
    public ApiResponse<List<MonthlyStats>> getMonthlyStats(
            Authentication auth,
            @RequestParam(defaultValue = "0") int year) {
        Long userId = (Long) auth.getPrincipal();
        if (year == 0) year = Year.now().getValue();
        return ApiResponse.ok(statsService.getMonthlyStats(userId, year));
    }

    @Operation(summary = "장르(카테고리) 분포")
    @GetMapping("/genres")
    public ApiResponse<List<GenreStats>> getGenreDistribution(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.ok(statsService.getGenreDistribution(userId));
    }

    @Operation(summary = "연간 통계 요약")
    @GetMapping("/yearly")
    public ApiResponse<YearlyStats> getYearlyStats(
            Authentication auth,
            @RequestParam(defaultValue = "0") int year) {
        Long userId = (Long) auth.getPrincipal();
        if (year == 0) year = Year.now().getValue();
        return ApiResponse.ok(statsService.getYearlyStats(userId, year));
    }
}

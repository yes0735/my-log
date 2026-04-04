package com.mylog.domain.goal.controller;

import com.mylog.domain.goal.dto.GoalRequest;
import com.mylog.domain.goal.dto.GoalResponse;
import com.mylog.domain.goal.service.GoalService;
import com.mylog.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Year;
import java.util.List;

@Tag(name = "Goals", description = "독서 목표 API")
@RestController
@RequestMapping("/api/v1/my/goals")
@RequiredArgsConstructor
public class GoalController {

    private final GoalService goalService;

    @Operation(summary = "목표 목록")
    @GetMapping
    public ApiResponse<List<GoalResponse>> getGoals(
            Authentication auth,
            @RequestParam(defaultValue = "0") int year) {
        Long userId = (Long) auth.getPrincipal();
        if (year == 0) year = Year.now().getValue();
        return ApiResponse.ok(goalService.getGoals(userId, year));
    }

    @Operation(summary = "목표 설정")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<GoalResponse> createGoal(
            Authentication auth, @Valid @RequestBody GoalRequest request) {
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.ok(goalService.createGoal(userId, request));
    }

    @Operation(summary = "목표 수정")
    @PutMapping("/{id}")
    public ApiResponse<GoalResponse> updateGoal(
            Authentication auth, @PathVariable Long id,
            @Valid @RequestBody GoalRequest request) {
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.ok(goalService.updateGoal(userId, id, request));
    }

    @Operation(summary = "목표 삭제")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteGoal(Authentication auth, @PathVariable Long id) {
        Long userId = (Long) auth.getPrincipal();
        goalService.deleteGoal(userId, id);
    }
}

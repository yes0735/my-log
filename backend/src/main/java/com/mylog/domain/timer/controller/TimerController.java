package com.mylog.domain.timer.controller;

import com.mylog.domain.timer.dto.SessionResponse;
import com.mylog.domain.timer.dto.StopSessionRequest;
import com.mylog.domain.timer.service.TimerService;
import com.mylog.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Timer", description = "독서 타이머 API")
@RestController
@RequiredArgsConstructor
public class TimerController {

    private final TimerService timerService;

    @Operation(summary = "독서 세션 시작")
    @PostMapping("/api/v1/my/books/{bookId}/sessions/start")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<SessionResponse> startSession(
            Authentication auth, @PathVariable Long bookId) {
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.ok(timerService.startSession(bookId));
    }

    @Operation(summary = "독서 세션 종료")
    @PostMapping("/api/v1/my/books/{bookId}/sessions/{id}/stop")
    public ApiResponse<SessionResponse> stopSession(
            Authentication auth, @PathVariable Long bookId,
            @PathVariable Long id,
            @RequestBody(required = false) StopSessionRequest request) {
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.ok(timerService.stopSession(bookId, id, request));
    }

    @Operation(summary = "독서 세션 목록")
    @GetMapping("/api/v1/my/books/{bookId}/sessions")
    public ApiResponse<List<SessionResponse>> getSessions(
            Authentication auth, @PathVariable Long bookId) {
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.ok(timerService.getSessions(bookId));
    }
}

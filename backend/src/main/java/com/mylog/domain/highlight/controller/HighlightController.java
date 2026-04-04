package com.mylog.domain.highlight.controller;

import com.mylog.domain.highlight.dto.HighlightRequest;
import com.mylog.domain.highlight.dto.HighlightResponse;
import com.mylog.domain.highlight.service.HighlightService;
import com.mylog.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Highlights", description = "하이라이트 API")
@RestController
@RequiredArgsConstructor
public class HighlightController {

    private final HighlightService highlightService;

    @Operation(summary = "책별 하이라이트 목록")
    @GetMapping("/api/v1/my/books/{bookId}/highlights")
    public ApiResponse<List<HighlightResponse>> getHighlights(
            Authentication auth, @PathVariable Long bookId) {
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.ok(highlightService.getHighlights(bookId));
    }

    @Operation(summary = "하이라이트 추가")
    @PostMapping("/api/v1/my/books/{bookId}/highlights")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<HighlightResponse> createHighlight(
            Authentication auth, @PathVariable Long bookId,
            @Valid @RequestBody HighlightRequest request) {
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.ok(highlightService.createHighlight(bookId, request));
    }

    @Operation(summary = "하이라이트 삭제")
    @DeleteMapping("/api/v1/highlights/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteHighlight(Authentication auth, @PathVariable Long id) {
        Long userId = (Long) auth.getPrincipal();
        highlightService.deleteHighlight(userId, id);
    }
}

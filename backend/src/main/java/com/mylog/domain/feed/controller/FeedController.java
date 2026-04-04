package com.mylog.domain.feed.controller;

import com.mylog.domain.feed.dto.FeedItem;
import com.mylog.domain.feed.service.FeedService;
import com.mylog.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@Tag(name = "Feed", description = "타임라인 피드 API")
@RestController
@RequestMapping("/api/v1/my/feed")
@RequiredArgsConstructor
public class FeedController {
    private final FeedService feedService;

    @Operation(summary = "타임라인 피드 조회")
    @GetMapping
    public ApiResponse<List<FeedItem>> getFeed(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.ok(feedService.getFeed(userId, page, size));
    }
}

package com.mylog.domain.discussion.controller;

import com.mylog.domain.discussion.dto.*;
import com.mylog.domain.discussion.service.DiscussionService;
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

import java.util.List;

@Tag(name = "Discussion", description = "토론 API")
@RestController
@RequiredArgsConstructor
public class DiscussionController {

    private final DiscussionService discussionService;

    @Operation(summary = "그룹 토론 목록 조회")
    @GetMapping("/api/v1/groups/{id}/discussions")
    public ApiResponse<Page<DiscussionResponse>> getDiscussions(
            @PathVariable Long id,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.ok(discussionService.getDiscussions(id, pageable));
    }

    @Operation(summary = "토론 생성")
    @PostMapping("/api/v1/groups/{id}/discussions")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<DiscussionResponse> createDiscussion(
            Authentication auth,
            @PathVariable Long id,
            @Valid @RequestBody DiscussionCreateRequest request) {
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.ok(discussionService.createDiscussion(userId, id, request));
    }

    @Operation(summary = "토론 상세 조회")
    @GetMapping("/api/v1/discussions/{id}")
    public ApiResponse<DiscussionResponse> getDiscussion(
            @PathVariable Long id) {
        return ApiResponse.ok(discussionService.getDiscussion(id));
    }

    @Operation(summary = "댓글 목록 조회")
    @GetMapping("/api/v1/discussions/{id}/comments")
    public ApiResponse<List<CommentResponse>> getComments(
            @PathVariable Long id) {
        return ApiResponse.ok(discussionService.getComments(id));
    }

    @Operation(summary = "댓글 작성")
    @PostMapping("/api/v1/discussions/{id}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<CommentResponse> createComment(
            Authentication auth,
            @PathVariable Long id,
            @Valid @RequestBody CommentCreateRequest request) {
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.ok(discussionService.createComment(userId, id, request));
    }

    @Operation(summary = "댓글 삭제")
    @DeleteMapping("/api/v1/comments/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteComment(
            Authentication auth,
            @PathVariable Long id) {
        Long userId = (Long) auth.getPrincipal();
        discussionService.deleteComment(userId, id);
    }
}

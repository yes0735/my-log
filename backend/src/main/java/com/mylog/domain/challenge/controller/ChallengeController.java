package com.mylog.domain.challenge.controller;

import com.mylog.domain.challenge.dto.ChallengeCreateRequest;
import com.mylog.domain.challenge.dto.ChallengeResponse;
import com.mylog.domain.challenge.dto.ParticipantResponse;
import com.mylog.domain.challenge.service.ChallengeService;
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

@Tag(name = "Challenge", description = "독서 챌린지 API")
@RestController
@RequiredArgsConstructor
public class ChallengeController {

    private final ChallengeService challengeService;

    @Operation(summary = "챌린지 목록 조회")
    @GetMapping("/api/v1/challenges")
    public ApiResponse<Page<ChallengeResponse>> getChallenges(
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.ok(challengeService.getChallenges(pageable));
    }

    @Operation(summary = "챌린지 생성")
    @PostMapping("/api/v1/challenges")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ChallengeResponse> createChallenge(
            Authentication auth,
            @Valid @RequestBody ChallengeCreateRequest request) {
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.ok(challengeService.createChallenge(userId, request));
    }

    @Operation(summary = "챌린지 상세 조회")
    @GetMapping("/api/v1/challenges/{id}")
    public ApiResponse<ChallengeResponse> getChallenge(
            @PathVariable Long id,
            Authentication auth) {
        Long viewerUserId = auth != null ? (Long) auth.getPrincipal() : null;
        return ApiResponse.ok(challengeService.getChallenge(id, viewerUserId));
    }

    @Operation(summary = "챌린지 참가")
    @PostMapping("/api/v1/challenges/{id}/join")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Void> joinChallenge(
            Authentication auth,
            @PathVariable Long id) {
        Long userId = (Long) auth.getPrincipal();
        challengeService.joinChallenge(userId, id);
        return ApiResponse.ok(null);
    }

    @Operation(summary = "챌린지 참가자 목록 조회")
    @GetMapping("/api/v1/challenges/{id}/participants")
    public ApiResponse<List<ParticipantResponse>> getParticipants(
            @PathVariable Long id) {
        return ApiResponse.ok(challengeService.getParticipants(id));
    }
}

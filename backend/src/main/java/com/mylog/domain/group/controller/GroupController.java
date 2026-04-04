package com.mylog.domain.group.controller;

import com.mylog.domain.group.dto.GroupCreateRequest;
import com.mylog.domain.group.dto.GroupMemberResponse;
import com.mylog.domain.group.dto.GroupResponse;
import com.mylog.domain.group.service.GroupService;
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

@Tag(name = "Group", description = "독서 그룹 API")
@RestController
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;

    @Operation(summary = "공개 그룹 목록 조회")
    @GetMapping("/api/v1/groups")
    public ApiResponse<Page<GroupResponse>> getPublicGroups(
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.ok(groupService.getPublicGroups(pageable));
    }

    @Operation(summary = "그룹 생성")
    @PostMapping("/api/v1/groups")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<GroupResponse> createGroup(
            Authentication auth,
            @Valid @RequestBody GroupCreateRequest request) {
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.ok(groupService.createGroup(userId, request));
    }

    @Operation(summary = "그룹 상세 조회")
    @GetMapping("/api/v1/groups/{id}")
    public ApiResponse<GroupResponse> getGroup(
            @PathVariable Long id,
            Authentication auth) {
        Long viewerUserId = auth != null ? (Long) auth.getPrincipal() : null;
        return ApiResponse.ok(groupService.getGroup(id, viewerUserId));
    }

    @Operation(summary = "그룹 가입")
    @PostMapping("/api/v1/groups/{id}/join")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Void> joinGroup(
            Authentication auth,
            @PathVariable Long id) {
        Long userId = (Long) auth.getPrincipal();
        groupService.joinGroup(userId, id);
        return ApiResponse.ok(null);
    }

    @Operation(summary = "그룹 탈퇴")
    @DeleteMapping("/api/v1/groups/{id}/leave")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void leaveGroup(
            Authentication auth,
            @PathVariable Long id) {
        Long userId = (Long) auth.getPrincipal();
        groupService.leaveGroup(userId, id);
    }

    @Operation(summary = "그룹 멤버 목록 조회")
    @GetMapping("/api/v1/groups/{id}/members")
    public ApiResponse<List<GroupMemberResponse>> getMembers(
            @PathVariable Long id) {
        return ApiResponse.ok(groupService.getMembers(id));
    }
}

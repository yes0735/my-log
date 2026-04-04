package com.mylog.global.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

// Design Ref: §6.1 — Error code definitions
@Getter
@AllArgsConstructor
public enum ErrorCode {

    // Auth
    AUTH_REQUIRED(HttpStatus.UNAUTHORIZED, "AUTH_001", "인증이 필요합니다"),
    TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "AUTH_002", "토큰이 만료되었습니다"),
    INVALID_CREDENTIALS(HttpStatus.BAD_REQUEST, "AUTH_003", "이메일 또는 비밀번호가 틀렸습니다"),
    DUPLICATE_EMAIL(HttpStatus.CONFLICT, "AUTH_004", "이미 가입된 이메일입니다"),

    // Book
    BOOK_NOT_FOUND(HttpStatus.NOT_FOUND, "BOOK_001", "책을 찾을 수 없습니다"),
    BOOK_ALREADY_IN_SHELF(HttpStatus.CONFLICT, "BOOK_002", "이미 서재에 추가된 책입니다"),

    // Follow
    FOLLOW_ALREADY_EXISTS(HttpStatus.CONFLICT, "FOLLOW_001", "이미 팔로우한 사용자입니다"),
    FOLLOW_NOT_FOUND(HttpStatus.NOT_FOUND, "FOLLOW_002", "팔로우 관계를 찾을 수 없습니다"),

    // Group
    GROUP_NOT_FOUND(HttpStatus.NOT_FOUND, "GROUP_001", "그룹을 찾을 수 없습니다"),
    GROUP_FULL(HttpStatus.CONFLICT, "GROUP_002", "그룹 인원이 가득 찼습니다"),
    ALREADY_MEMBER(HttpStatus.CONFLICT, "GROUP_003", "이미 그룹에 가입된 회원입니다"),
    NOT_MEMBER(HttpStatus.FORBIDDEN, "GROUP_004", "그룹 멤버가 아닙니다"),
    CANNOT_LEAVE_AS_CREATOR(HttpStatus.FORBIDDEN, "GROUP_005", "그룹 생성자는 탈퇴할 수 없습니다"),

    // Discussion
    DISCUSSION_NOT_FOUND(HttpStatus.NOT_FOUND, "DISCUSSION_001", "토론을 찾을 수 없습니다"),
    COMMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "COMMENT_001", "댓글을 찾을 수 없습니다"),

    // Challenge
    CHALLENGE_NOT_FOUND(HttpStatus.NOT_FOUND, "CHALLENGE_001", "챌린지를 찾을 수 없습니다"),
    CHALLENGE_ALREADY_JOINED(HttpStatus.CONFLICT, "CHALLENGE_002", "이미 참가한 챌린지입니다"),
    CHALLENGE_NOT_ACTIVE(HttpStatus.BAD_REQUEST, "CHALLENGE_003", "현재 참가할 수 없는 챌린지입니다"),

    // Highlight
    HIGHLIGHT_NOT_FOUND(HttpStatus.NOT_FOUND, "HIGHLIGHT_001", "하이라이트를 찾을 수 없습니다"),

    // Session
    SESSION_NOT_FOUND(HttpStatus.NOT_FOUND, "SESSION_001", "독서 세션을 찾을 수 없습니다"),

    // Common
    ENTITY_NOT_FOUND(HttpStatus.NOT_FOUND, "COMMON_001", "요청한 리소스를 찾을 수 없습니다"),
    ACCESS_DENIED(HttpStatus.FORBIDDEN, "COMMON_002", "접근 권한이 없습니다"),

    // Validation
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "VALID_001", "입력값이 올바르지 않습니다"),

    // External
    EXTERNAL_API_ERROR(HttpStatus.BAD_GATEWAY, "EXTERNAL_001", "외부 서비스에 일시적 장애가 발생했습니다"),

    // Server
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "SERVER_001", "서버 오류가 발생했습니다");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}

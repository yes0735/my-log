package com.mylog.domain.follow.service;

import com.mylog.domain.book.entity.ReadingStatus;
import com.mylog.domain.book.repository.UserBookRepository;
import com.mylog.domain.follow.dto.FollowResponse;
import com.mylog.domain.follow.dto.ProfileUpdateRequest;
import com.mylog.domain.follow.dto.UserProfileResponse;
import com.mylog.domain.follow.entity.Follow;
import com.mylog.domain.follow.repository.FollowRepository;
import com.mylog.domain.user.entity.User;
import com.mylog.domain.user.repository.UserRepository;
import com.mylog.global.exception.BusinessException;
import com.mylog.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FollowService {

    private final FollowRepository followRepository;
    private final UserRepository userRepository;
    private final UserBookRepository userBookRepository;

    @Transactional
    public void follow(Long userId, Long targetId) {
        if (userId.equals(targetId)) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "자기 자신을 팔로우할 수 없습니다");
        }
        if (followRepository.existsByFollowerIdAndFollowingId(userId, targetId)) {
            throw new BusinessException(ErrorCode.FOLLOW_ALREADY_EXISTS);
        }
        userRepository.findById(targetId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND));

        Follow follow = Follow.builder()
                .followerId(userId)
                .followingId(targetId)
                .build();
        followRepository.save(follow);
    }

    @Transactional
    public void unfollow(Long userId, Long targetId) {
        followRepository.deleteByFollowerIdAndFollowingId(userId, targetId);
    }

    public Page<FollowResponse> getFollowers(Long userId, Pageable pageable) {
        return followRepository.findByFollowingId(userId, pageable)
                .map(follow -> {
                    User follower = userRepository.findById(follow.getFollowerId())
                            .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND));
                    return FollowResponse.builder()
                            .userId(follower.getId())
                            .nickname(follower.getNickname())
                            .profileImageUrl(follower.getProfileImageUrl())
                            .followedAt(follow.getCreatedAt())
                            .build();
                });
    }

    public Page<FollowResponse> getFollowing(Long userId, Pageable pageable) {
        return followRepository.findByFollowerId(userId, pageable)
                .map(follow -> {
                    User following = userRepository.findById(follow.getFollowingId())
                            .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND));
                    return FollowResponse.builder()
                            .userId(following.getId())
                            .nickname(following.getNickname())
                            .profileImageUrl(following.getProfileImageUrl())
                            .followedAt(follow.getCreatedAt())
                            .build();
                });
    }

    public UserProfileResponse getProfile(Long userId, Long viewerId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND));

        long totalBooks = userBookRepository.countByUserId(userId);
        long completedBooks = userBookRepository.countByUserIdAndStatus(userId, ReadingStatus.COMPLETED);
        long followerCount = followRepository.countByFollowingId(userId);
        long followingCount = followRepository.countByFollowerId(userId);

        Boolean isFollowing = null;
        if (viewerId != null && !viewerId.equals(userId)) {
            isFollowing = followRepository.existsByFollowerIdAndFollowingId(viewerId, userId);
        }

        return UserProfileResponse.builder()
                .id(user.getId())
                .nickname(user.getNickname())
                .profileImageUrl(user.getProfileImageUrl())
                .stats(UserProfileResponse.Stats.builder()
                        .totalBooks(totalBooks)
                        .completedBooks(completedBooks)
                        .followerCount(followerCount)
                        .followingCount(followingCount)
                        .build())
                .isFollowing(isFollowing)
                .build();
    }

    @Transactional
    public UserProfileResponse updateProfile(Long userId, ProfileUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND));

        if (request.getNickname() != null) {
            user.setNickname(request.getNickname());
        }
        if (request.getProfileImageUrl() != null) {
            user.setProfileImageUrl(request.getProfileImageUrl());
        }

        return getProfile(userId, null);
    }
}

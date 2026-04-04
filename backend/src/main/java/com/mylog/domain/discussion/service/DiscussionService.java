package com.mylog.domain.discussion.service;

import com.mylog.domain.discussion.dto.*;
import com.mylog.domain.discussion.entity.Comment;
import com.mylog.domain.discussion.entity.Discussion;
import com.mylog.domain.discussion.repository.CommentRepository;
import com.mylog.domain.discussion.repository.DiscussionRepository;
import com.mylog.domain.group.repository.GroupMemberRepository;
import com.mylog.domain.user.entity.User;
import com.mylog.domain.user.repository.UserRepository;
import com.mylog.global.exception.BusinessException;
import com.mylog.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DiscussionService {

    private final DiscussionRepository discussionRepository;
    private final CommentRepository commentRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserRepository userRepository;

    public Page<DiscussionResponse> getDiscussions(Long groupId, Pageable pageable) {
        return discussionRepository.findByGroupIdOrderByCreatedAtDesc(groupId, pageable)
                .map(discussion -> {
                    User author = userRepository.findById(discussion.getUserId())
                            .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND));
                    long commentCount = commentRepository.countByDiscussionId(discussion.getId());
                    return DiscussionResponse.from(discussion, author.getNickname(), author.getProfileImageUrl(), commentCount);
                });
    }

    @Transactional
    public DiscussionResponse createDiscussion(Long userId, Long groupId, DiscussionCreateRequest request) {
        if (!groupMemberRepository.existsByGroupIdAndUserId(groupId, userId)) {
            throw new BusinessException(ErrorCode.NOT_MEMBER);
        }

        Discussion discussion = Discussion.builder()
                .groupId(groupId)
                .userId(userId)
                .title(request.getTitle())
                .content(request.getContent())
                .build();
        discussionRepository.save(discussion);

        User author = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND));
        return DiscussionResponse.from(discussion, author.getNickname(), author.getProfileImageUrl(), 0);
    }

    public DiscussionResponse getDiscussion(Long discussionId) {
        Discussion discussion = discussionRepository.findById(discussionId)
                .orElseThrow(() -> new BusinessException(ErrorCode.DISCUSSION_NOT_FOUND));

        User author = userRepository.findById(discussion.getUserId())
                .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND));
        long commentCount = commentRepository.countByDiscussionId(discussionId);
        return DiscussionResponse.from(discussion, author.getNickname(), author.getProfileImageUrl(), commentCount);
    }

    public List<CommentResponse> getComments(Long discussionId) {
        discussionRepository.findById(discussionId)
                .orElseThrow(() -> new BusinessException(ErrorCode.DISCUSSION_NOT_FOUND));

        return commentRepository.findByDiscussionIdOrderByCreatedAtAsc(discussionId).stream()
                .map(comment -> {
                    User author = userRepository.findById(comment.getUserId())
                            .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND));
                    return CommentResponse.builder()
                            .id(comment.getId())
                            .discussionId(comment.getDiscussionId())
                            .userId(comment.getUserId())
                            .authorNickname(author.getNickname())
                            .authorProfileImageUrl(author.getProfileImageUrl())
                            .content(comment.getContent())
                            .parentId(comment.getParentId())
                            .createdAt(comment.getCreatedAt())
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public CommentResponse createComment(Long userId, Long discussionId, CommentCreateRequest request) {
        Discussion discussion = discussionRepository.findById(discussionId)
                .orElseThrow(() -> new BusinessException(ErrorCode.DISCUSSION_NOT_FOUND));

        if (!groupMemberRepository.existsByGroupIdAndUserId(discussion.getGroupId(), userId)) {
            throw new BusinessException(ErrorCode.NOT_MEMBER);
        }

        Comment comment = Comment.builder()
                .discussionId(discussionId)
                .userId(userId)
                .content(request.getContent())
                .parentId(request.getParentId())
                .build();
        commentRepository.save(comment);

        User author = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND));
        return CommentResponse.builder()
                .id(comment.getId())
                .discussionId(comment.getDiscussionId())
                .userId(comment.getUserId())
                .authorNickname(author.getNickname())
                .authorProfileImageUrl(author.getProfileImageUrl())
                .content(comment.getContent())
                .parentId(comment.getParentId())
                .createdAt(comment.getCreatedAt())
                .build();
    }

    @Transactional
    public void deleteComment(Long userId, Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COMMENT_NOT_FOUND));

        if (!comment.getUserId().equals(userId)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED);
        }

        commentRepository.delete(comment);
    }
}

package com.mylog.domain.group.service;

import com.mylog.domain.group.dto.GroupCreateRequest;
import com.mylog.domain.group.dto.GroupMemberResponse;
import com.mylog.domain.group.dto.GroupResponse;
import com.mylog.domain.group.entity.GroupMember;
import com.mylog.domain.group.entity.ReadingGroup;
import com.mylog.domain.group.repository.GroupMemberRepository;
import com.mylog.domain.group.repository.ReadingGroupRepository;
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
public class GroupService {

    private final ReadingGroupRepository readingGroupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserRepository userRepository;

    public Page<GroupResponse> getPublicGroups(Pageable pageable) {
        return readingGroupRepository.findByIsPublicTrue(pageable)
                .map(group -> {
                    String creatorNickname = userRepository.findById(group.getCreatorId())
                            .map(User::getNickname)
                            .orElse("탈퇴한 사용자");
                    long memberCount = groupMemberRepository.countByGroupId(group.getId());
                    return GroupResponse.from(group, creatorNickname, memberCount, false);
                });
    }

    @Transactional
    public GroupResponse createGroup(Long userId, GroupCreateRequest request) {
        ReadingGroup group = ReadingGroup.builder()
                .name(request.getName())
                .description(request.getDescription())
                .creatorId(userId)
                .maxMembers(request.getMaxMembers() != null ? request.getMaxMembers() : 50)
                .isPublic(request.getIsPublic() != null ? request.getIsPublic() : true)
                .build();
        readingGroupRepository.save(group);

        GroupMember creator = GroupMember.builder()
                .groupId(group.getId())
                .userId(userId)
                .role("CREATOR")
                .build();
        groupMemberRepository.save(creator);

        String nickname = userRepository.findById(userId)
                .map(User::getNickname)
                .orElse("");
        return GroupResponse.from(group, nickname, 1, true);
    }

    public GroupResponse getGroup(Long groupId, Long viewerUserId) {
        ReadingGroup group = readingGroupRepository.findById(groupId)
                .orElseThrow(() -> new BusinessException(ErrorCode.GROUP_NOT_FOUND));

        String creatorNickname = userRepository.findById(group.getCreatorId())
                .map(User::getNickname)
                .orElse("탈퇴한 사용자");
        long memberCount = groupMemberRepository.countByGroupId(groupId);
        boolean isMember = viewerUserId != null && groupMemberRepository.existsByGroupIdAndUserId(groupId, viewerUserId);

        return GroupResponse.from(group, creatorNickname, memberCount, isMember);
    }

    @Transactional
    public void joinGroup(Long userId, Long groupId) {
        ReadingGroup group = readingGroupRepository.findById(groupId)
                .orElseThrow(() -> new BusinessException(ErrorCode.GROUP_NOT_FOUND));

        if (groupMemberRepository.existsByGroupIdAndUserId(groupId, userId)) {
            throw new BusinessException(ErrorCode.ALREADY_MEMBER);
        }

        long memberCount = groupMemberRepository.countByGroupId(groupId);
        if (memberCount >= group.getMaxMembers()) {
            throw new BusinessException(ErrorCode.GROUP_FULL);
        }

        GroupMember member = GroupMember.builder()
                .groupId(groupId)
                .userId(userId)
                .role("MEMBER")
                .build();
        groupMemberRepository.save(member);
    }

    @Transactional
    public void leaveGroup(Long userId, Long groupId) {
        ReadingGroup group = readingGroupRepository.findById(groupId)
                .orElseThrow(() -> new BusinessException(ErrorCode.GROUP_NOT_FOUND));

        if (group.getCreatorId().equals(userId)) {
            throw new BusinessException(ErrorCode.CANNOT_LEAVE_AS_CREATOR);
        }

        if (!groupMemberRepository.existsByGroupIdAndUserId(groupId, userId)) {
            throw new BusinessException(ErrorCode.NOT_MEMBER);
        }

        groupMemberRepository.deleteByGroupIdAndUserId(groupId, userId);
    }

    public List<GroupMemberResponse> getMembers(Long groupId) {
        readingGroupRepository.findById(groupId)
                .orElseThrow(() -> new BusinessException(ErrorCode.GROUP_NOT_FOUND));

        return groupMemberRepository.findByGroupId(groupId).stream()
                .map(member -> {
                    User user = userRepository.findById(member.getUserId())
                            .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND));
                    return GroupMemberResponse.builder()
                            .userId(user.getId())
                            .nickname(user.getNickname())
                            .profileImageUrl(user.getProfileImageUrl())
                            .role(member.getRole())
                            .joinedAt(member.getJoinedAt())
                            .build();
                })
                .collect(Collectors.toList());
    }
}

package com.mylog.domain.challenge.service;

import com.mylog.domain.challenge.dto.ChallengeCreateRequest;
import com.mylog.domain.challenge.dto.ChallengeResponse;
import com.mylog.domain.challenge.dto.ParticipantResponse;
import com.mylog.domain.challenge.entity.Challenge;
import com.mylog.domain.challenge.entity.ChallengeParticipant;
import com.mylog.domain.challenge.repository.ChallengeParticipantRepository;
import com.mylog.domain.challenge.repository.ChallengeRepository;
import com.mylog.domain.user.entity.User;
import com.mylog.domain.user.repository.UserRepository;
import com.mylog.global.exception.BusinessException;
import com.mylog.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChallengeService {

    private final ChallengeRepository challengeRepository;
    private final ChallengeParticipantRepository challengeParticipantRepository;
    private final UserRepository userRepository;

    public Page<ChallengeResponse> getChallenges(Pageable pageable) {
        return challengeRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(challenge -> {
                    String creatorNickname = userRepository.findById(challenge.getCreatorId())
                            .map(User::getNickname)
                            .orElse("탈퇴한 사용자");
                    long count = challengeParticipantRepository.countByChallengeId(challenge.getId());
                    return ChallengeResponse.from(challenge, creatorNickname, count, false);
                });
    }

    @Transactional
    public ChallengeResponse createChallenge(Long userId, ChallengeCreateRequest request) {
        Challenge challenge = Challenge.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .creatorId(userId)
                .targetBooks(request.getTargetBooks())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .build();
        challengeRepository.save(challenge);

        // Auto-join creator
        ChallengeParticipant creator = ChallengeParticipant.builder()
                .challengeId(challenge.getId())
                .userId(userId)
                .build();
        challengeParticipantRepository.save(creator);

        String nickname = userRepository.findById(userId)
                .map(User::getNickname)
                .orElse("");
        return ChallengeResponse.from(challenge, nickname, 1, true);
    }

    public ChallengeResponse getChallenge(Long challengeId, Long viewerUserId) {
        Challenge challenge = challengeRepository.findById(challengeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CHALLENGE_NOT_FOUND));

        String creatorNickname = userRepository.findById(challenge.getCreatorId())
                .map(User::getNickname)
                .orElse("탈퇴한 사용자");
        long count = challengeParticipantRepository.countByChallengeId(challengeId);
        boolean isJoined = viewerUserId != null
                && challengeParticipantRepository.existsByChallengeIdAndUserId(challengeId, viewerUserId);

        return ChallengeResponse.from(challenge, creatorNickname, count, isJoined);
    }

    @Transactional
    public void joinChallenge(Long userId, Long challengeId) {
        Challenge challenge = challengeRepository.findById(challengeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CHALLENGE_NOT_FOUND));

        if (challengeParticipantRepository.existsByChallengeIdAndUserId(challengeId, userId)) {
            throw new BusinessException(ErrorCode.CHALLENGE_ALREADY_JOINED);
        }

        LocalDate today = LocalDate.now();
        if (today.isBefore(challenge.getStartDate()) || today.isAfter(challenge.getEndDate())) {
            throw new BusinessException(ErrorCode.CHALLENGE_NOT_ACTIVE);
        }

        ChallengeParticipant participant = ChallengeParticipant.builder()
                .challengeId(challengeId)
                .userId(userId)
                .build();
        challengeParticipantRepository.save(participant);
    }

    public List<ParticipantResponse> getParticipants(Long challengeId) {
        challengeRepository.findById(challengeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.CHALLENGE_NOT_FOUND));

        return challengeParticipantRepository.findByChallengeId(challengeId).stream()
                .map(participant -> {
                    User user = userRepository.findById(participant.getUserId())
                            .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND));
                    return ParticipantResponse.builder()
                            .userId(user.getId())
                            .nickname(user.getNickname())
                            .profileImageUrl(user.getProfileImageUrl())
                            .completedBooks(participant.getCompletedBooks())
                            .joinedAt(participant.getJoinedAt())
                            .build();
                })
                .collect(Collectors.toList());
    }
}

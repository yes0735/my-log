package com.mylog.domain.timer.service;

import com.mylog.domain.timer.dto.SessionResponse;
import com.mylog.domain.timer.dto.StopSessionRequest;
import com.mylog.domain.timer.entity.ReadingSession;
import com.mylog.domain.timer.repository.ReadingSessionRepository;
import com.mylog.global.exception.BusinessException;
import com.mylog.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TimerService {

    private final ReadingSessionRepository sessionRepository;

    @Transactional
    public SessionResponse startSession(Long userBookId) {
        ReadingSession session = ReadingSession.builder()
                .userBookId(userBookId)
                .startTime(LocalDateTime.now())
                .build();

        return SessionResponse.from(sessionRepository.save(session));
    }

    @Transactional
    public SessionResponse stopSession(Long userBookId, Long sessionId, StopSessionRequest request) {
        ReadingSession session = sessionRepository.findByIdAndUserBookId(sessionId, userBookId)
                .orElseThrow(() -> new BusinessException(ErrorCode.SESSION_NOT_FOUND));

        LocalDateTime now = LocalDateTime.now();
        session.setEndTime(now);
        session.setDurationMinutes((int) Duration.between(session.getStartTime(), now).toMinutes());

        if (request != null && request.getPagesRead() != null) {
            session.setPagesRead(request.getPagesRead());
        }

        return SessionResponse.from(session);
    }

    public List<SessionResponse> getSessions(Long userBookId) {
        return sessionRepository.findByUserBookIdOrderByStartTimeDesc(userBookId)
                .stream().map(SessionResponse::from).toList();
    }
}

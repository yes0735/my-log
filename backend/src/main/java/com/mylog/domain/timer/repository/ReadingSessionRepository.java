package com.mylog.domain.timer.repository;

import com.mylog.domain.timer.entity.ReadingSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReadingSessionRepository extends JpaRepository<ReadingSession, Long> {
    List<ReadingSession> findByUserBookIdOrderByStartTimeDesc(Long userBookId);
    Optional<ReadingSession> findByIdAndUserBookId(Long id, Long userBookId);
}

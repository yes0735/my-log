package com.mylog.domain.goal.repository;

import com.mylog.domain.goal.entity.ReadingGoal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReadingGoalRepository extends JpaRepository<ReadingGoal, Long> {
    List<ReadingGoal> findByUserIdAndTargetYear(Long userId, Integer targetYear);
    Optional<ReadingGoal> findByIdAndUserId(Long id, Long userId);
}

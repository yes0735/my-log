package com.mylog.domain.goal.service;

import com.mylog.domain.goal.dto.GoalRequest;
import com.mylog.domain.goal.dto.GoalResponse;
import com.mylog.domain.goal.entity.ReadingGoal;
import com.mylog.domain.goal.repository.ReadingGoalRepository;
import com.mylog.global.exception.BusinessException;
import com.mylog.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GoalService {

    private final ReadingGoalRepository goalRepository;

    public List<GoalResponse> getGoals(Long userId, int year) {
        return goalRepository.findByUserIdAndTargetYear(userId, year)
                .stream().map(GoalResponse::from).toList();
    }

    @Transactional
    public GoalResponse createGoal(Long userId, GoalRequest request) {
        ReadingGoal goal = ReadingGoal.builder()
                .userId(userId)
                .targetYear(request.getTargetYear())
                .targetMonth(request.getTargetMonth())
                .targetBooks(request.getTargetBooks())
                .build();
        return GoalResponse.from(goalRepository.save(goal));
    }

    @Transactional
    public GoalResponse updateGoal(Long userId, Long goalId, GoalRequest request) {
        ReadingGoal goal = goalRepository.findByIdAndUserId(goalId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BOOK_NOT_FOUND, "목표를 찾을 수 없습니다"));
        goal.setTargetYear(request.getTargetYear());
        goal.setTargetMonth(request.getTargetMonth());
        goal.setTargetBooks(request.getTargetBooks());
        return GoalResponse.from(goal);
    }

    @Transactional
    public void deleteGoal(Long userId, Long goalId) {
        ReadingGoal goal = goalRepository.findByIdAndUserId(goalId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BOOK_NOT_FOUND, "목표를 찾을 수 없습니다"));
        goalRepository.delete(goal);
    }
}

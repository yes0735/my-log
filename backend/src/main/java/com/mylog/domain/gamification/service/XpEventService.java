package com.mylog.domain.gamification.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class XpEventService {

    private final LevelService levelService;
    private final BadgeService badgeService;

    public void onRecordCreated(Long userId) {
        levelService.addXp(userId, 10);
        badgeService.checkAndAward(userId, "RECORD");
    }

    public void onBookCompleted(Long userId) {
        levelService.addXp(userId, 100);
        badgeService.checkAndAward(userId, "COMPLETED");
    }

    public void onReviewCreated(Long userId) {
        levelService.addXp(userId, 50);
        badgeService.checkAndAward(userId, "REVIEW");
    }
}

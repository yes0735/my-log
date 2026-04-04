package com.mylog.domain.gamification.service;

import com.mylog.domain.gamification.dto.LevelResponse;
import com.mylog.domain.gamification.entity.UserLevel;
import com.mylog.domain.gamification.repository.UserLevelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LevelService {

    private final UserLevelRepository userLevelRepository;

    public LevelResponse getLevel(Long userId) {
        UserLevel level = getOrCreate(userId);
        int progress = level.getNextLevelXp() > 0
                ? (int) ((level.getCurrentLevelXp() * 100.0) / level.getNextLevelXp()) : 0;
        return LevelResponse.builder()
                .level(level.getLevel())
                .totalXp(level.getTotalXp())
                .currentLevelXp(level.getCurrentLevelXp())
                .nextLevelXp(level.getNextLevelXp())
                .progressPercent(progress)
                .build();
    }

    @Transactional
    public UserLevel getOrCreate(Long userId) {
        return userLevelRepository.findByUserId(userId).orElseGet(() -> {
            UserLevel newLevel = UserLevel.builder().userId(userId).build();
            return userLevelRepository.save(newLevel);
        });
    }

    @Transactional
    public void addXp(Long userId, int xp) {
        UserLevel level = getOrCreate(userId);
        level.setTotalXp(level.getTotalXp() + xp);
        level.setCurrentLevelXp(level.getCurrentLevelXp() + xp);

        while (level.getCurrentLevelXp() >= level.getNextLevelXp()) {
            level.setCurrentLevelXp(level.getCurrentLevelXp() - level.getNextLevelXp());
            level.setLevel(level.getLevel() + 1);
            level.setNextLevelXp(calculateNextLevelXp(level.getLevel()));
        }

        userLevelRepository.save(level);
    }

    private int calculateNextLevelXp(int level) {
        return switch (level) {
            case 1 -> 100;
            case 2 -> 250;
            case 3 -> 500;
            case 4 -> 1000;
            default -> level * 500;
        };
    }
}

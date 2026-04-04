package com.mylog.domain.gamification.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_levels")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class UserLevel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(nullable = false)
    @Builder.Default
    private Integer level = 1;

    @Column(name = "total_xp", nullable = false)
    @Builder.Default
    private Integer totalXp = 0;

    @Column(name = "current_level_xp", nullable = false)
    @Builder.Default
    private Integer currentLevelXp = 0;

    @Column(name = "next_level_xp", nullable = false)
    @Builder.Default
    private Integer nextLevelXp = 100;
}

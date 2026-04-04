package com.mylog.domain.gamification.repository;

import com.mylog.domain.gamification.entity.Badge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BadgeRepository extends JpaRepository<Badge, Long> {
    Optional<Badge> findByCode(String code);
    List<Badge> findAll();
}

package com.mylog.domain.goal.entity;

import com.mylog.global.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

// Design Ref: §3.1 — ReadingGoal entity
@Entity
@Table(name = "reading_goals")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ReadingGoal extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "target_year", nullable = false)
    private Integer targetYear;

    @Column(name = "target_month")
    private Integer targetMonth;

    @Column(name = "target_books", nullable = false)
    private Integer targetBooks;

    @Column(name = "completed_books")
    @Builder.Default
    private Integer completedBooks = 0;
}

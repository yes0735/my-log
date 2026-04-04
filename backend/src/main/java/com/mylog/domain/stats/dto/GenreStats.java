package com.mylog.domain.stats.dto;

import lombok.*;

@Getter
@Builder
@AllArgsConstructor
public class GenreStats {
    private String name;
    private long count;
}

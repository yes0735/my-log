package com.mylog.domain.group.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupCreateRequest {

    @NotBlank(message = "그룹 이름은 필수입니다")
    @Size(max = 100, message = "그룹 이름은 100자 이하여야 합니다")
    private String name;

    private String description;

    private Integer maxMembers;

    private Boolean isPublic;
}

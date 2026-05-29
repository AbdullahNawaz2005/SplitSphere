package com.splitsphere.dto.group;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateGroupRequest(
        @NotBlank @Size(max = 100) @Pattern(regexp = "^[^<>]*$", message = "must not contain HTML markup") String name,
        @Size(max = 500) @Pattern(regexp = "^[^<>]*$", message = "must not contain HTML markup") String description
) {
    public CreateGroupRequest {
        name = name == null ? null : name.trim();
        description = description == null ? null : description.trim();
    }
}

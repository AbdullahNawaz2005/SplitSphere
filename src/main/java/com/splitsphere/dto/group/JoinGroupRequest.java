package com.splitsphere.dto.group;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record JoinGroupRequest(
        @NotBlank @Size(min = 6, max = 20) @Pattern(regexp = "^[A-Za-z0-9]+$", message = "must be alphanumeric") String inviteCode
) {
    public JoinGroupRequest {
        inviteCode = inviteCode == null ? null : inviteCode.trim().toUpperCase();
    }
}

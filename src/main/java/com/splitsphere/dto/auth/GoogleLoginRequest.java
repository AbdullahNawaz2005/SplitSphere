package com.splitsphere.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GoogleLoginRequest(
        @NotBlank @Size(max = 8192) String idToken
) {
    public GoogleLoginRequest {
        idToken = idToken == null ? null : idToken.trim();
    }
}

package com.splitsphere.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank @Email @Size(max = 150) String email,
        @NotBlank @Size(min = 1, max = 100) String password
) {
    public LoginRequest {
        email = email == null ? null : email.trim();
    }
}

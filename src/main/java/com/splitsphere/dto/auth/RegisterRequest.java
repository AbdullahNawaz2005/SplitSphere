package com.splitsphere.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Size(max = 100) @Pattern(regexp = "^[^<>]*$", message = "must not contain HTML markup") String name,
        @NotBlank @Email @Size(max = 150) String email,
        @NotBlank @Size(min = 8, max = 100) String password
) {
    public RegisterRequest {
        name = name == null ? null : name.trim();
        email = email == null ? null : email.trim();
    }
}

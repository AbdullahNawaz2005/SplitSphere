package com.splitsphere.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

/**
 * Binds {@code app.cors.*} properties from application.yml.
 *
 * <p>{@code allowed-origins} is the <strong>primary</strong> list of origins
 * (populated from {@code CORS_ALLOWED_ORIGINS} env var or the YAML default).
 *
 * <p>{@code frontend-url} is an <strong>optional supplement</strong> that can
 * hold one or more comma-separated origins via the {@code FRONTEND_URL} env
 * var.  At runtime, both lists are merged in
 * {@link SecurityConfig#corsConfigurationSource()}.
 */
@ConfigurationProperties(prefix = "app.cors")
public record CorsProperties(
        List<String> allowedOrigins,
        String frontendUrl
) {
}

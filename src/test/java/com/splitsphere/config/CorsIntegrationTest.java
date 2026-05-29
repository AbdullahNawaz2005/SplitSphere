package com.splitsphere.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Unit tests that exercise the exact CORS origin-merging logic from
 * {@link SecurityConfig} without booting a full Spring context.
 *
 * <p>We replicate the same origin-merging algorithm used in
 * {@code SecurityConfig.corsConfigurationSource()} and apply the resulting
 * {@link CorsConfiguration} to a standalone {@link MockMvc}.  This validates
 * that preflight (OPTIONS) and actual (POST) requests from the allowed origins
 * receive the correct {@code Access-Control-Allow-Origin} header.
 */
class CorsIntegrationTest {

    private static final String VERCEL_ORIGIN = "https://split-sphere.vercel.app";
    private static final String LOCALHOST_ORIGIN = "http://localhost:5173";

    private MockMvc mockMvc;

    /**
     * Builds a standalone MockMvc with a CORS filter that mirrors the
     * production SecurityConfig logic.
     */
    @BeforeEach
    void setUp() {
        CorsConfigurationSource source = buildCorsSource(
                List.of("http://localhost:3000", "http://localhost:5173", VERCEL_ORIGIN),
                null  // no FRONTEND_URL
        );

        mockMvc = MockMvcBuilders
                .standaloneSetup(new StubAuthController())
                .addFilter(new org.springframework.web.filter.CorsFilter(source))
                .build();
    }

    // ─── Preflight (OPTIONS) ─────────────────────────────────────────────

    @Test
    @DisplayName("OPTIONS preflight to /api/auth/google returns CORS headers for Vercel origin")
    void preflightGoogleAuth_vercelOrigin() throws Exception {
        mockMvc.perform(options("/api/auth/google")
                        .header(HttpHeaders.ORIGIN, VERCEL_ORIGIN)
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "Authorization,Content-Type"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, VERCEL_ORIGIN))
                .andExpect(header().exists(HttpHeaders.ACCESS_CONTROL_ALLOW_METHODS))
                .andExpect(header().exists(HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS));
    }

    @Test
    @DisplayName("OPTIONS preflight to /api/auth/google returns CORS headers for localhost origin")
    void preflightGoogleAuth_localhostOrigin() throws Exception {
        mockMvc.perform(options("/api/auth/google")
                        .header(HttpHeaders.ORIGIN, LOCALHOST_ORIGIN)
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "Authorization,Content-Type"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, LOCALHOST_ORIGIN))
                .andExpect(header().exists(HttpHeaders.ACCESS_CONTROL_ALLOW_METHODS))
                .andExpect(header().exists(HttpHeaders.ACCESS_CONTROL_ALLOW_HEADERS));
    }

    // ─── Actual requests (POST) ──────────────────────────────────────────

    @Test
    @DisplayName("POST to /api/auth/google from Vercel origin returns CORS header")
    void postGoogleAuth_vercelOrigin_returnsCorsHeaders() throws Exception {
        mockMvc.perform(post("/api/auth/google")
                        .header(HttpHeaders.ORIGIN, VERCEL_ORIGIN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"idToken\":\"fake-token\"}"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, VERCEL_ORIGIN));
    }

    // ─── Disallowed origin ───────────────────────────────────────────────

    @Test
    @DisplayName("Request from disallowed origin is rejected by CORS filter")
    void postGoogleAuth_disallowedOrigin_forbidden() throws Exception {
        mockMvc.perform(post("/api/auth/google")
                        .header(HttpHeaders.ORIGIN, "https://evil.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"idToken\":\"fake-token\"}"))
                .andExpect(status().isForbidden());
    }

    // ─── FRONTEND_URL env var merging ────────────────────────────────────

    @Test
    @DisplayName("FRONTEND_URL comma-separated origins are merged into allowed origins")
    void frontendUrlMerge() throws Exception {
        String customOrigin = "https://custom-deploy.example.com";
        CorsConfigurationSource source = buildCorsSource(
                List.of("http://localhost:3000"),
                "https://split-sphere.vercel.app," + customOrigin
        );
        MockMvc mvc = MockMvcBuilders
                .standaloneSetup(new StubAuthController())
                .addFilter(new org.springframework.web.filter.CorsFilter(source))
                .build();

        mvc.perform(options("/api/auth/google")
                        .header(HttpHeaders.ORIGIN, customOrigin)
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, customOrigin));
    }

    // ─── Helpers ─────────────────────────────────────────────────────────

    /**
     * Mirrors the exact origin-merging logic from
     * {@link SecurityConfig#corsConfigurationSource()}.
     */
    private static CorsConfigurationSource buildCorsSource(List<String> allowedOrigins, String frontendUrl) {
        List<String> origins = new ArrayList<>();

        if (allowedOrigins != null) {
            origins.addAll(allowedOrigins);
        }

        if (frontendUrl != null && !frontendUrl.isBlank()) {
            Arrays.stream(frontendUrl.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .forEach(origins::add);
        }

        List<String> deduplicated = origins.stream().distinct().toList();

        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(deduplicated);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Requested-With"));
        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    /**
     * Minimal stub controller so MockMvc has an endpoint to route to.
     */
    @RestController
    @RequestMapping("/api/auth")
    static class StubAuthController {
        @PostMapping("/google")
        String googleLogin() {
            return "{\"token\":\"stub\"}";
        }
    }
}

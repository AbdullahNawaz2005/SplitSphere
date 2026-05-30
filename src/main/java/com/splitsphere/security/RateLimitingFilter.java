package com.splitsphere.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.splitsphere.exception.ErrorResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final long WINDOW_MILLIS = 60_000L;
    private static final int AUTHENTICATED_LIMIT = 300;
    private static final int PUBLIC_API_LIMIT = 60;
    private static final int LOGIN_LIMIT = 5;
    private static final int REGISTER_LIMIT = 3;
    private static final int JOIN_GROUP_LIMIT = 10;

    private final ObjectMapper objectMapper;
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return "OPTIONS".equalsIgnoreCase(request.getMethod())
                || request.getRequestURI().startsWith("/actuator/health")
                || request.getRequestURI().startsWith("/v3/api-docs")
                || request.getRequestURI().startsWith("/swagger-ui")
                || request.getRequestURI().equals("/swagger-ui.html");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        LimitRule rule = resolveRule(request);
        if (!consume(rule.key(), rule.limit())) {
            writeTooManyRequests(response, request, rule.limit());
            return;
        }
        filterChain.doFilter(request, response);
    }

    private LimitRule resolveRule(HttpServletRequest request) {
        String method = request.getMethod();
        String path = request.getRequestURI();
        String ip = clientIp(request);
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean authenticated = authentication != null && authentication.isAuthenticated()
                && authentication.getPrincipal() instanceof UserPrincipal;
        String principalKey = authenticated
                ? ((UserPrincipal) authentication.getPrincipal()).getId().toString()
                : ip;

        if ("POST".equals(method) && "/api/auth/login".equals(path)) {
            return new LimitRule("ip:%s:%s:%s".formatted(ip, method, path), LOGIN_LIMIT);
        }
        if ("POST".equals(method) && "/api/auth/register".equals(path)) {
            return new LimitRule("ip:%s:%s:%s".formatted(ip, method, path), REGISTER_LIMIT);
        }
        if ("POST".equals(method) && "/api/groups/join".equals(path)) {
            String scope = authenticated ? "user" : "ip";
            return new LimitRule("%s:%s:%s:%s".formatted(scope, principalKey, method, path), JOIN_GROUP_LIMIT);
        }
        if (authenticated) {
            return new LimitRule("user:%s:api".formatted(principalKey), AUTHENTICATED_LIMIT);
        }
        return new LimitRule("ip:%s:api".formatted(ip), PUBLIC_API_LIMIT);
    }

    private boolean consume(String key, int limit) {
        long now = System.currentTimeMillis();
        Bucket bucket = buckets.compute(key, (ignored, existing) -> {
            if (existing == null || now >= existing.windowStartedAt() + WINDOW_MILLIS) {
                return new Bucket(now, 1);
            }
            return new Bucket(existing.windowStartedAt(), existing.count() + 1);
        });
        if (buckets.size() > 10_000) {
            buckets.entrySet().removeIf(entry -> now >= entry.getValue().windowStartedAt() + (WINDOW_MILLIS * 2));
        }
        return bucket.count() <= limit;
    }

    private String clientIp(HttpServletRequest request) {
        // Render terminates traffic before the app, but X-Forwarded-For remains user-controllable
        // unless a trusted proxy chain is explicitly enforced. Use the servlet remote address
        // so spoofed forwarded headers cannot reset public rate-limit buckets.
        return request.getRemoteAddr();
    }

    private void writeTooManyRequests(HttpServletResponse response, HttpServletRequest request, int limit)
            throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setHeader("Retry-After", "60");
        objectMapper.writeValue(response.getOutputStream(), new ErrorResponse(
                Instant.now(),
                HttpStatus.TOO_MANY_REQUESTS.value(),
                HttpStatus.TOO_MANY_REQUESTS.getReasonPhrase(),
                "Too many requests. Please retry shortly.",
                request.getRequestURI(),
                Map.of("limit", "%d requests per minute".formatted(limit))
        ));
    }

    private record LimitRule(String key, int limit) {
    }

    private record Bucket(long windowStartedAt, int count) {
    }
}

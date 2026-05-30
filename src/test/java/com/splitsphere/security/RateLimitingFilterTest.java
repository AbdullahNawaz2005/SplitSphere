package com.splitsphere.security;

import com.fasterxml.jackson.databind.json.JsonMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

class RateLimitingFilterTest {

    private final RateLimitingFilter filter = new RateLimitingFilter(JsonMapper.builder().findAndAddModules().build());

    @Test
    void spoofedXForwardedForDoesNotBypassLoginLimit() throws Exception {
        AtomicInteger passedRequests = new AtomicInteger();

        for (int i = 1; i <= 5; i++) {
            MockHttpServletResponse response = performLoginAttempt("203.0.113." + i, passedRequests);
            assertThat(response.getStatus()).isEqualTo(200);
        }

        MockHttpServletResponse blocked = performLoginAttempt("203.0.113.99", passedRequests);

        assertThat(blocked.getStatus()).isEqualTo(429);
        assertThat(passedRequests).hasValue(5);
    }

    private MockHttpServletResponse performLoginAttempt(String spoofedForwardedFor, AtomicInteger passedRequests)
            throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
        request.setRemoteAddr("10.0.0.42");
        request.addHeader("X-Forwarded-For", spoofedForwardedFor);
        MockHttpServletResponse response = new MockHttpServletResponse();

        FilterChain chain = new CountingFilterChain(passedRequests);
        filter.doFilter(request, response, chain);
        return response;
    }

    private static class CountingFilterChain implements FilterChain {
        private final AtomicInteger passedRequests;

        private CountingFilterChain(AtomicInteger passedRequests) {
            this.passedRequests = passedRequests;
        }

        @Override
        public void doFilter(ServletRequest request, ServletResponse response) {
            passedRequests.incrementAndGet();
        }
    }
}

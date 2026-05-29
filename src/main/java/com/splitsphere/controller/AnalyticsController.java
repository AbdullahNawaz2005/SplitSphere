package com.splitsphere.controller;

import com.splitsphere.dto.analytics.GroupAnalyticsResponse;
import com.splitsphere.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/group/{groupId}")
    public GroupAnalyticsResponse groupAnalytics(@PathVariable UUID groupId) {
        return analyticsService.groupAnalytics(groupId);
    }

}

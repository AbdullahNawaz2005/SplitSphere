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
@RequestMapping("/api/groups/{groupId}/analytics")
@RequiredArgsConstructor
public class GroupAnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping
    public GroupAnalyticsResponse groupAnalytics(@PathVariable UUID groupId) {
        return analyticsService.groupAnalytics(groupId);
    }
}

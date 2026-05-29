package com.splitsphere.controller;

import com.splitsphere.dto.activity.ActivityLogResponse;
import com.splitsphere.dto.common.PageResponse;
import com.splitsphere.service.ActivityLogService;
import com.splitsphere.service.GroupService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@Validated
@RestController
@RequestMapping("/api/groups/{groupId}/activity")
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityLogService activityLogService;
    private final GroupService groupService;

    @GetMapping
    public PageResponse<ActivityLogResponse> groupActivity(
            @PathVariable UUID groupId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size
    ) {
        groupService.requireActiveMember(groupId);
        return activityLogService.groupActivity(groupId, page, size);
    }
}

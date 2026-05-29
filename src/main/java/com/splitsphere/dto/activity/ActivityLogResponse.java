package com.splitsphere.dto.activity;

import com.splitsphere.entity.ActivityLog;

import java.time.Instant;
import java.util.UUID;

public record ActivityLogResponse(
        UUID id,
        UUID groupId,
        UUID userId,
        String userName,
        String action,
        String description,
        Instant createdAt
) {
    public static ActivityLogResponse from(ActivityLog activityLog) {
        return new ActivityLogResponse(
                activityLog.getId(),
                activityLog.getGroup().getId(),
                activityLog.getUser().getId(),
                activityLog.getUser().getName(),
                activityLog.getAction(),
                activityLog.getDescription(),
                activityLog.getCreatedAt()
        );
    }
}

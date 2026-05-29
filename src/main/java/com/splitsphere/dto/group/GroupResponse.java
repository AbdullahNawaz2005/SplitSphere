package com.splitsphere.dto.group;

import com.splitsphere.entity.ExpenseGroup;

import java.time.Instant;
import java.util.UUID;

public record GroupResponse(
        UUID id,
        String name,
        String description,
        String inviteCode,
        UUID ownerId,
        String ownerName,
        Instant createdAt
) {
    public static GroupResponse from(ExpenseGroup group) {
        return new GroupResponse(
                group.getId(),
                group.getName(),
                null,
                group.getInviteCode(),
                group.getOwner().getId(),
                group.getOwner().getName(),
                group.getCreatedAt()
        );
    }
}

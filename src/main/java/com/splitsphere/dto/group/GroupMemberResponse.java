package com.splitsphere.dto.group;

import com.splitsphere.entity.GroupMember;

import java.time.Instant;
import java.util.UUID;

public record GroupMemberResponse(
        UUID userId,
        String name,
        String email,
        String role,
        Instant joinedAt
) {
    public static GroupMemberResponse from(GroupMember member) {
        return new GroupMemberResponse(
                member.getUser().getId(),
                member.getUser().getName(),
                member.getUser().getEmail(),
                member.getRole().name(),
                member.getJoinedAt()
        );
    }
}

package com.splitsphere.repository;

import com.splitsphere.entity.ExpenseGroup;
import com.splitsphere.entity.GroupMember;
import com.splitsphere.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GroupMemberRepository extends JpaRepository<GroupMember, UUID> {
    boolean existsByGroupAndUser(ExpenseGroup group, User user);

    boolean existsByGroupIdAndUserId(UUID groupId, UUID userId);

    Optional<GroupMember> findByGroupAndUser(ExpenseGroup group, User user);

    @EntityGraph(attributePaths = {"group", "group.owner"})
    List<GroupMember> findByUser(User user);

    @EntityGraph(attributePaths = "user")
    List<GroupMember> findByGroupId(UUID groupId);

    Optional<GroupMember> findByGroupIdAndUserId(UUID groupId, UUID userId);
}

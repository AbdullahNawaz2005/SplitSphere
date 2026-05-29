package com.splitsphere.repository;

import com.splitsphere.entity.ExpenseGroup;
import com.splitsphere.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ExpenseGroupRepository extends JpaRepository<ExpenseGroup, UUID> {
    boolean existsByInviteCode(String inviteCode);

    Optional<ExpenseGroup> findByInviteCode(String inviteCode);

    boolean existsByIdAndOwner(UUID id, User owner);
}

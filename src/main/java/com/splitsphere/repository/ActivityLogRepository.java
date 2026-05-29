package com.splitsphere.repository;

import com.splitsphere.entity.ActivityLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, UUID> {

    @EntityGraph(attributePaths = {"user"})
    Page<ActivityLog> findByGroupId(UUID groupId, Pageable pageable);
}

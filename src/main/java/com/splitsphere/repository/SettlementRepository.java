package com.splitsphere.repository;

import com.splitsphere.entity.ExpenseGroup;
import com.splitsphere.entity.Settlement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SettlementRepository extends JpaRepository<Settlement, UUID> {

    @EntityGraph(attributePaths = {"payer", "receiver"})
    Page<Settlement> findByGroupId(UUID groupId, Pageable pageable);

    @EntityGraph(attributePaths = {"payer", "receiver"})
    List<Settlement> findByGroup(ExpenseGroup group);
}

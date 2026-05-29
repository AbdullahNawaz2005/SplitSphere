package com.splitsphere.repository;

import com.splitsphere.entity.Expense;
import com.splitsphere.entity.ExpenseGroup;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ExpenseRepository extends JpaRepository<Expense, UUID> {

    @EntityGraph(attributePaths = {"payer", "category"})
    Page<Expense> findByGroupId(UUID groupId, Pageable pageable);

    @EntityGraph(attributePaths = {"payer", "category"})
    Page<Expense> findByGroupIdAndTitleContainingIgnoreCase(UUID groupId, String search, Pageable pageable);

    @EntityGraph(attributePaths = {"payer", "splits", "splits.user"})
    List<Expense> findByGroup(ExpenseGroup group);
}

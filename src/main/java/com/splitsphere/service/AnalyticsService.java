package com.splitsphere.service;

import com.splitsphere.dto.analytics.GroupAnalyticsResponse;
import com.splitsphere.entity.Expense;
import com.splitsphere.entity.ExpenseGroup;
import com.splitsphere.entity.enums.SettlementStatus;
import com.splitsphere.repository.ExpenseRepository;
import com.splitsphere.repository.SettlementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final ExpenseRepository expenseRepository;
    private final SettlementRepository settlementRepository;
    private final GroupService groupService;

    @Transactional(readOnly = true)
    public GroupAnalyticsResponse groupAnalytics(UUID groupId) {
        groupService.requireActiveMember(groupId);
        ExpenseGroup group = groupService.getGroup(groupId);
        var expenses = expenseRepository.findByGroup(group);

        BigDecimal totalExpenses = expenses.stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalSettled = settlementRepository.findByGroup(group).stream()
                .filter(settlement -> settlement.getStatus() == SettlementStatus.COMPLETED)
                .map(settlement -> settlement.getAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        Map<String, BigDecimal> byCategory = expenses.stream()
                .collect(Collectors.groupingBy(
                        expense -> expense.getCategory() == null ? "Uncategorized" : expense.getCategory().getName(),
                        LinkedHashMap::new,
                        Collectors.reducing(BigDecimal.ZERO, Expense::getAmount, BigDecimal::add)
                ));

        return new GroupAnalyticsResponse(groupId, totalExpenses, expenses.size(), totalSettled, byCategory);
    }
}

package com.splitsphere.service;

import com.splitsphere.dto.common.PageResponse;
import com.splitsphere.dto.expense.CreateExpenseRequest;
import com.splitsphere.dto.expense.ExpenseResponse;
import com.splitsphere.dto.expense.SplitRequest;
import com.splitsphere.dto.expense.UpdateExpenseRequest;
import com.splitsphere.entity.Category;
import com.splitsphere.entity.Expense;
import com.splitsphere.entity.ExpenseGroup;
import com.splitsphere.entity.ExpenseSplit;
import com.splitsphere.entity.User;
import com.splitsphere.entity.enums.SplitType;
import com.splitsphere.exception.BadRequestException;
import com.splitsphere.exception.ForbiddenException;
import com.splitsphere.exception.ResourceNotFoundException;
import com.splitsphere.repository.CategoryRepository;
import com.splitsphere.repository.ExpenseRepository;
import com.splitsphere.repository.UserRepository;
import com.splitsphere.util.InputSanitizer;
import com.splitsphere.util.MoneyUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final GroupService groupService;
    private final CurrentUserService currentUserService;
    private final ActivityLogService activityLogService;

    @Transactional
    public ExpenseResponse createExpense(CreateExpenseRequest request) {
        if (request.groupId() == null) {
            throw new BadRequestException("Group id is required");
        }
        User actor = currentUserService.getCurrentUser();
        ExpenseGroup group = groupService.getGroup(request.groupId());
        groupService.requireActiveMember(group, actor);

        User payer = loadUser(request.payerId());
        groupService.requireActiveMember(group, payer);

        Expense expense = new Expense();
        expense.setGroup(group);
        expense.setPayer(payer);
        applyExpenseFields(expense, request.categoryId(), request.description(), request.amount(),
                request.splitType());
        expense.replaceSplits(buildSplits(group, request.amount(), request.splitType(), request.splits()));

        Expense saved = expenseRepository.save(expense);
        activityLogService.record(group, actor, "EXPENSE_ADDED", actor.getName() + " added " + saved.getTitle());
        return ExpenseResponse.from(saved);
    }

    @Transactional
    public ExpenseResponse updateExpense(UUID expenseId, UpdateExpenseRequest request) {
        User actor = currentUserService.getCurrentUser();
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found"));
        groupService.requireActiveMember(expense.getGroup(), actor);
        requireExpenseManager(expense, actor);

        User payer = loadUser(request.payerId());
        groupService.requireActiveMember(expense.getGroup(), payer);

        expense.setPayer(payer);
        applyExpenseFields(expense, request.categoryId(), request.description(), request.amount(),
                request.splitType());
        expense.replaceSplits(buildSplits(expense.getGroup(), request.amount(), request.splitType(), request.splits()));

        return ExpenseResponse.from(expenseRepository.save(expense));
    }

    @Transactional
    public void deleteExpense(UUID expenseId) {
        User actor = currentUserService.getCurrentUser();
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found"));
        groupService.requireActiveMember(expense.getGroup(), actor);
        requireExpenseManager(expense, actor);
        expenseRepository.delete(expense);
    }

    @Transactional(readOnly = true)
    public PageResponse<ExpenseResponse> listGroupExpenses(UUID groupId, int page, int size, String search) {
        groupService.requireActiveMember(groupId);
        Pageable pageable = PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.DESC, "createdAt"));
        var expenses = (search == null || search.isBlank())
                ? expenseRepository.findByGroupId(groupId, pageable)
                : expenseRepository.findByGroupIdAndTitleContainingIgnoreCase(groupId, search.trim(), pageable);
        return PageResponse.from(expenses.map(ExpenseResponse::from));
    }

    @Transactional(readOnly = true)
    public ExpenseResponse getExpense(UUID expenseId) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found"));
        groupService.requireActiveMember(expense.getGroup().getId());
        return ExpenseResponse.from(expense);
    }

    private void applyExpenseFields(
            Expense expense,
            UUID categoryId,
            String description,
            BigDecimal amount,
            SplitType splitType
    ) {
        expense.setCategory(categoryId == null ? null : categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found")));
        BigDecimal normalizedAmount = MoneyUtils.normalize(amount);
        MoneyUtils.requirePositive(normalizedAmount, "Expense amount");
        expense.setTitle(InputSanitizer.cleanText(description));
        expense.setAmount(normalizedAmount);
        expense.setNotes("Split method: " + splitType.name());
    }

    private List<ExpenseSplit> buildSplits(
            ExpenseGroup group,
            BigDecimal amount,
            SplitType splitType,
            List<SplitRequest> splitRequests
    ) {
        if (splitRequests == null || splitRequests.isEmpty()) {
            throw new BadRequestException("At least one split participant is required");
        }
        ensureUniqueParticipants(splitRequests);

        List<User> participants = splitRequests.stream()
                .map(split -> loadUser(split.userId()))
                .toList();
        participants.forEach(user -> groupService.requireActiveMember(group, user));

        Map<UUID, BigDecimal> splitAmounts = switch (splitType) {
            case EQUAL -> equalSplit(amount, participants);
            case CUSTOM -> customSplit(amount, splitRequests);
        };

        List<ExpenseSplit> splits = new ArrayList<>();
        for (User participant : participants) {
            ExpenseSplit split = new ExpenseSplit();
            split.setUser(participant);
            split.setOwedAmount(splitAmounts.get(participant.getId()));
            splits.add(split);
        }
        return splits;
    }

    private Map<UUID, BigDecimal> equalSplit(BigDecimal amount, List<User> participants) {
        BigDecimal normalized = MoneyUtils.normalize(amount);
        long cents = normalized.movePointRight(2).longValueExact();
        long base = cents / participants.size();
        long remainder = cents % participants.size();

        Map<UUID, BigDecimal> result = new LinkedHashMap<>();
        for (int i = 0; i < participants.size(); i++) {
            long participantCents = base + (i < remainder ? 1 : 0);
            result.put(participants.get(i).getId(), BigDecimal.valueOf(participantCents, 2));
        }
        return result;
    }

    private Map<UUID, BigDecimal> customSplit(BigDecimal amount, List<SplitRequest> splitRequests) {
        Map<UUID, BigDecimal> result = new LinkedHashMap<>();
        BigDecimal sum = BigDecimal.ZERO;
        for (SplitRequest splitRequest : splitRequests) {
            if (splitRequest.amount() == null) {
                throw new BadRequestException("Custom split amount is required for every participant");
            }
            BigDecimal splitAmount = MoneyUtils.normalize(splitRequest.amount());
            if (splitAmount.compareTo(BigDecimal.ZERO) < 0) {
                throw new BadRequestException("Custom split amounts cannot be negative");
            }
            result.put(splitRequest.userId(), splitAmount);
            sum = sum.add(splitAmount);
        }
        if (sum.compareTo(MoneyUtils.normalize(amount)) != 0) {
            throw new BadRequestException("Custom split amounts must equal the expense amount");
        }
        return result;
    }

    private void ensureUniqueParticipants(List<SplitRequest> splitRequests) {
        HashSet<UUID> userIds = new HashSet<>();
        for (SplitRequest splitRequest : splitRequests) {
            if (!userIds.add(splitRequest.userId())) {
                throw new BadRequestException("Duplicate split participant: " + splitRequest.userId());
            }
        }
    }

    private void requireExpenseManager(Expense expense, User actor) {
        boolean isOwner = expense.getGroup().getOwner().getId().equals(actor.getId());
        boolean isPayer = expense.getPayer().getId().equals(actor.getId());
        if (!isOwner && !isPayer) {
            throw new ForbiddenException("Only the payer or group owner can manage this expense");
        }
    }

    private User loadUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
    }
}

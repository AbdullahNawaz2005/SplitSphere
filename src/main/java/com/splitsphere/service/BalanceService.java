package com.splitsphere.service;

import com.splitsphere.dto.balance.DebtResponse;
import com.splitsphere.dto.balance.GroupBalanceResponse;
import com.splitsphere.dto.balance.UserBalanceResponse;
import com.splitsphere.entity.Expense;
import com.splitsphere.entity.ExpenseGroup;
import com.splitsphere.entity.GroupMember;
import com.splitsphere.entity.Settlement;
import com.splitsphere.entity.User;
import com.splitsphere.entity.enums.SettlementStatus;
import com.splitsphere.repository.ExpenseRepository;
import com.splitsphere.repository.GroupMemberRepository;
import com.splitsphere.repository.SettlementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BalanceService {

    private final ExpenseRepository expenseRepository;
    private final SettlementRepository settlementRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final GroupService groupService;

    @Transactional(readOnly = true)
    public GroupBalanceResponse getGroupBalances(UUID groupId) {
        groupService.requireActiveMember(groupId);
        ExpenseGroup group = groupService.getGroup(groupId);
        BalanceSnapshot snapshot = calculateSnapshot(group);
        return new GroupBalanceResponse(groupId, snapshot.userBalances(), optimizeDebts(snapshot.netBalances(), snapshot.users()));
    }

    @Transactional(readOnly = true)
    public List<DebtResponse> getOptimizedSettlements(UUID groupId) {
        groupService.requireActiveMember(groupId);
        ExpenseGroup group = groupService.getGroup(groupId);
        BalanceSnapshot snapshot = calculateSnapshot(group);
        return optimizeDebts(snapshot.netBalances(), snapshot.users());
    }

    BalanceSnapshot calculateSnapshot(ExpenseGroup group) {
        Map<UUID, User> users = new LinkedHashMap<>();
        Map<UUID, BigDecimal> net = new LinkedHashMap<>();

        for (GroupMember member : groupMemberRepository.findByGroupId(group.getId())) {
            users.put(member.getUser().getId(), member.getUser());
            net.put(member.getUser().getId(), BigDecimal.ZERO);
        }

        for (Expense expense : expenseRepository.findByGroup(group)) {
            includeUser(users, net, expense.getPayer());
            net.compute(expense.getPayer().getId(), (id, current) -> current.add(expense.getAmount()));
            expense.getSplits().forEach(split -> {
                includeUser(users, net, split.getUser());
                net.compute(split.getUser().getId(), (id, current) -> current.subtract(split.getOwedAmount()));
            });
        }

        for (Settlement settlement : settlementRepository.findByGroup(group)) {
            if (settlement.getStatus() != SettlementStatus.COMPLETED) {
                continue;
            }
            includeUser(users, net, settlement.getPayer());
            includeUser(users, net, settlement.getReceiver());
            net.compute(settlement.getPayer().getId(), (id, current) -> current.add(settlement.getAmount()));
            net.compute(settlement.getReceiver().getId(), (id, current) -> current.subtract(settlement.getAmount()));
        }

        List<UserBalanceResponse> balances = net.entrySet().stream()
                .map(entry -> new UserBalanceResponse(entry.getKey(), users.get(entry.getKey()).getName(), entry.getValue()))
                .sorted(Comparator.comparing(UserBalanceResponse::userName))
                .toList();
        return new BalanceSnapshot(users, net, balances);
    }

    private void includeUser(Map<UUID, User> users, Map<UUID, BigDecimal> net, User user) {
        users.putIfAbsent(user.getId(), user);
        net.putIfAbsent(user.getId(), BigDecimal.ZERO);
    }

    List<DebtResponse> optimizeDebts(Map<UUID, BigDecimal> netBalances, Map<UUID, User> users) {
        List<BalanceNode> debtors = new ArrayList<>();
        List<BalanceNode> creditors = new ArrayList<>();

        netBalances.forEach((userId, amount) -> {
            long cents = amount.movePointRight(2).longValueExact();
            if (cents < 0) {
                debtors.add(new BalanceNode(userId, -cents));
            } else if (cents > 0) {
                creditors.add(new BalanceNode(userId, cents));
            }
        });

        debtors.sort(Comparator.comparingLong(BalanceNode::cents).reversed());
        creditors.sort(Comparator.comparingLong(BalanceNode::cents).reversed());

        List<DebtResponse> settlements = new ArrayList<>();
        int i = 0;
        int j = 0;
        while (i < debtors.size() && j < creditors.size()) {
            BalanceNode debtor = debtors.get(i);
            BalanceNode creditor = creditors.get(j);
            long paidCents = Math.min(debtor.cents(), creditor.cents());

            User from = users.get(debtor.userId());
            User to = users.get(creditor.userId());
            settlements.add(new DebtResponse(
                    from.getId(),
                    from.getName(),
                    to.getId(),
                    to.getName(),
                    BigDecimal.valueOf(paidCents, 2)
            ));

            debtor = debtor.minus(paidCents);
            creditor = creditor.minus(paidCents);
            debtors.set(i, debtor);
            creditors.set(j, creditor);

            if (debtor.cents() == 0) {
                i++;
            }
            if (creditor.cents() == 0) {
                j++;
            }
        }
        return settlements;
    }

    record BalanceSnapshot(
            Map<UUID, User> users,
            Map<UUID, BigDecimal> netBalances,
            List<UserBalanceResponse> userBalances
    ) {
    }

    private record BalanceNode(UUID userId, long cents) {
        BalanceNode minus(long amount) {
            return new BalanceNode(userId, cents - amount);
        }
    }
}

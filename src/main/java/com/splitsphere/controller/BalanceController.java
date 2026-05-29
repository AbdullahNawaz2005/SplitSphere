package com.splitsphere.controller;

import com.splitsphere.dto.balance.DebtResponse;
import com.splitsphere.dto.balance.GroupBalanceResponse;
import com.splitsphere.service.BalanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/balances")
@RequiredArgsConstructor
public class BalanceController {

    private final BalanceService balanceService;

    @GetMapping("/group/{groupId}")
    public GroupBalanceResponse groupBalances(@PathVariable UUID groupId) {
        return balanceService.getGroupBalances(groupId);
    }


    @GetMapping("/group/{groupId}/settlements")
    public List<DebtResponse> optimizedSettlements(@PathVariable UUID groupId) {
        return balanceService.getOptimizedSettlements(groupId);
    }

}

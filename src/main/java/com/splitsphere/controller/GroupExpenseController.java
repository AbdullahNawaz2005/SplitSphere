package com.splitsphere.controller;

import com.splitsphere.dto.common.PageResponse;
import com.splitsphere.dto.expense.CreateExpenseRequest;
import com.splitsphere.dto.expense.ExpenseResponse;
import com.splitsphere.service.ExpenseService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@Validated
@RestController
@RequestMapping("/api/groups/{groupId}/expenses")
@RequiredArgsConstructor
public class GroupExpenseController {

    private final ExpenseService expenseService;

    @PostMapping
    public ResponseEntity<ExpenseResponse> createExpense(
            @PathVariable UUID groupId,
            @Valid @RequestBody CreateExpenseRequest request
    ) {
        CreateExpenseRequest scopedRequest = new CreateExpenseRequest(
                groupId,
                request.payerId(),
                request.categoryId(),
                request.description(),
                request.amount(),
                request.splitType(),
                request.expenseDate(),
                request.splits()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(expenseService.createExpense(scopedRequest));
    }

    @GetMapping
    public PageResponse<ExpenseResponse> groupExpenses(
            @PathVariable UUID groupId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
            @RequestParam(required = false) @Size(max = 150) String search
    ) {
        return expenseService.listGroupExpenses(groupId, page, size, search);
    }
}

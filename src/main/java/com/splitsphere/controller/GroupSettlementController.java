package com.splitsphere.controller;

import com.splitsphere.dto.common.PageResponse;
import com.splitsphere.dto.settlement.CreateSettlementRequest;
import com.splitsphere.dto.settlement.SettlementResponse;
import com.splitsphere.service.SettlementService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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
@RequestMapping("/api/groups/{groupId}/settlements")
@RequiredArgsConstructor
public class GroupSettlementController {

    private final SettlementService settlementService;

    @PostMapping
    public ResponseEntity<SettlementResponse> recordSettlement(
            @PathVariable UUID groupId,
            @Valid @RequestBody CreateSettlementRequest request
    ) {
        CreateSettlementRequest scopedRequest = new CreateSettlementRequest(
                groupId,
                request.payerId(),
                request.receiverId(),
                request.amount(),
                request.note()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(settlementService.recordSettlement(scopedRequest));
    }

    @GetMapping
    public PageResponse<SettlementResponse> listSettlements(
            @PathVariable UUID groupId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size
    ) {
        return settlementService.listSettlements(groupId, page, size);
    }
}

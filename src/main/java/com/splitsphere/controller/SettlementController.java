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
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@Validated
@RestController
@RequestMapping("/api/settlements")
@RequiredArgsConstructor
public class SettlementController {

    private final SettlementService settlementService;

    @PostMapping
    public ResponseEntity<SettlementResponse> recordSettlement(@Valid @RequestBody CreateSettlementRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(settlementService.recordSettlement(request));
    }

    @GetMapping
    public PageResponse<SettlementResponse> listSettlements(
            @RequestParam UUID groupId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size
    ) {
        return settlementService.listSettlements(groupId, page, size);
    }

    @PatchMapping("/{settlementId}/complete")
    public SettlementResponse completeSettlement(@PathVariable UUID settlementId) {
        return settlementService.completeSettlement(settlementId);
    }

    @PostMapping("/{settlementId}/reject")
    public SettlementResponse rejectSettlement(@PathVariable UUID settlementId) {
        return settlementService.rejectSettlement(settlementId);
    }
}

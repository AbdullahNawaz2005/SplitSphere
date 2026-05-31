ALTER TABLE settlements
    DROP CONSTRAINT IF EXISTS chk_settlements_status;

ALTER TABLE settlements
    ADD CONSTRAINT chk_settlements_status
        CHECK (status IN ('PENDING', 'PENDING_CONFIRMATION', 'COMPLETED', 'REJECTED', 'CANCELLED'));

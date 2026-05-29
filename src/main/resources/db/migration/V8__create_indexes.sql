-- Lookup and join indexes for the main API access paths.
CREATE INDEX IF NOT EXISTS idx_users_email
    ON users (email);

CREATE INDEX IF NOT EXISTS idx_groups_owner_id
    ON groups (owner_id);

CREATE INDEX IF NOT EXISTS idx_groups_invite_code
    ON groups (invite_code);

CREATE INDEX IF NOT EXISTS idx_group_members_group_id
    ON group_members (group_id);

CREATE INDEX IF NOT EXISTS idx_group_members_user_id
    ON group_members (user_id);

CREATE INDEX IF NOT EXISTS idx_expenses_group_id
    ON expenses (group_id);

CREATE INDEX IF NOT EXISTS idx_expenses_payer_id
    ON expenses (payer_id);

CREATE INDEX IF NOT EXISTS idx_expenses_category_id
    ON expenses (category_id);

CREATE INDEX IF NOT EXISTS idx_expense_splits_expense_id
    ON expense_splits (expense_id);

CREATE INDEX IF NOT EXISTS idx_expense_splits_user_id
    ON expense_splits (user_id);

CREATE INDEX IF NOT EXISTS idx_settlements_group_id
    ON settlements (group_id);

CREATE INDEX IF NOT EXISTS idx_settlements_payer_id
    ON settlements (payer_id);

CREATE INDEX IF NOT EXISTS idx_settlements_receiver_id
    ON settlements (receiver_id);

CREATE INDEX IF NOT EXISTS idx_activity_logs_group_id
    ON activity_logs (group_id);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at
    ON activity_logs (created_at DESC);

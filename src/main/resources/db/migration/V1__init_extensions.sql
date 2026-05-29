-- PostgreSQL extensions and shared database utilities for SplitSphere.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Keeps updated_at columns accurate without relying on application code.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

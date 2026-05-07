-- V4: Add user_id + audit timestamps to fuel and task tables.
-- Reuses shared_set_updated_at() created in V3.

-- tb_fuel_records
ALTER TABLE tb_fuel_records
    ADD COLUMN user_id    UUID,
    ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX idx_fuel_records_user_id
    ON tb_fuel_records (user_id);

CREATE INDEX idx_fuel_records_user_date
    ON tb_fuel_records (user_id, date);

CREATE TRIGGER trg_fuel_records_updated_at
    BEFORE UPDATE ON tb_fuel_records
    FOR EACH ROW EXECUTE FUNCTION shared_set_updated_at();

-- tb_routine_tasks
ALTER TABLE tb_routine_tasks
    ADD COLUMN user_id    UUID,
    ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX idx_routine_tasks_user_id
    ON tb_routine_tasks (user_id);

CREATE TRIGGER trg_routine_tasks_updated_at
    BEFORE UPDATE ON tb_routine_tasks
    FOR EACH ROW EXECUTE FUNCTION shared_set_updated_at();

-- Rollback V4: Remove user_id, timestamps, triggers and indexes from fuel and task tables.

DROP TRIGGER IF EXISTS trg_routine_tasks_updated_at ON tb_routine_tasks;
DROP TRIGGER IF EXISTS trg_fuel_records_updated_at  ON tb_fuel_records;

ALTER TABLE tb_routine_tasks DROP COLUMN IF EXISTS user_id;
ALTER TABLE tb_routine_tasks DROP COLUMN IF EXISTS created_at;
ALTER TABLE tb_routine_tasks DROP COLUMN IF EXISTS updated_at;

ALTER TABLE tb_fuel_records DROP COLUMN IF EXISTS user_id;
ALTER TABLE tb_fuel_records DROP COLUMN IF EXISTS created_at;
ALTER TABLE tb_fuel_records DROP COLUMN IF EXISTS updated_at;

DROP INDEX IF EXISTS idx_routine_tasks_user_id;
DROP INDEX IF EXISTS idx_fuel_records_user_id;
DROP INDEX IF EXISTS idx_fuel_records_user_date;

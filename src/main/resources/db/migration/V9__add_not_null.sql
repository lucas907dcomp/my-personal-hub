-- V9: Add NOT NULL constraints to remaining required business fields.
-- Backfills any legacy NULL values before constraining (safe for existing data).

BEGIN;

-- ==========================================
-- tb_gym_exercises
-- ==========================================
UPDATE tb_gym_exercises SET weight = 0            WHERE weight IS NULL;
UPDATE tb_gym_exercises SET rpe = 8               WHERE rpe IS NULL;
UPDATE tb_gym_exercises SET can_increase_next = false WHERE can_increase_next IS NULL;

ALTER TABLE tb_gym_exercises
    ALTER COLUMN weight            SET DEFAULT 0,
    ALTER COLUMN weight            SET NOT NULL,
    ALTER COLUMN rpe               SET DEFAULT 8,
    ALTER COLUMN rpe               SET NOT NULL,
    ALTER COLUMN can_increase_next SET DEFAULT false,
    ALTER COLUMN can_increase_next SET NOT NULL;

-- ==========================================
-- tb_gym_supplements
-- ==========================================
UPDATE tb_gym_supplements SET whey = false     WHERE whey IS NULL;
UPDATE tb_gym_supplements SET creatina = false WHERE creatina IS NULL;

ALTER TABLE tb_gym_supplements
    ALTER COLUMN whey     SET DEFAULT false,
    ALTER COLUMN whey     SET NOT NULL,
    ALTER COLUMN creatina SET DEFAULT false,
    ALTER COLUMN creatina SET NOT NULL;

-- ==========================================
-- tb_routine_tasks
-- ==========================================
UPDATE tb_routine_tasks SET done = false WHERE done IS NULL;

ALTER TABLE tb_routine_tasks
    ALTER COLUMN done SET DEFAULT false,
    ALTER COLUMN done SET NOT NULL;

COMMIT;

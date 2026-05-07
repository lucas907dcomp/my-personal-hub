-- Rollback V3: Remove user_id, timestamps, triggers and indexes from gym tables.
-- Run manually if V3 needs to be reverted. V2 rollback must run first if V2 is also rolled back.

DROP TRIGGER IF EXISTS trg_gym_exercises_updated_at ON tb_gym_exercises;
DROP TRIGGER IF EXISTS trg_gym_workouts_updated_at  ON tb_gym_workouts;

ALTER TABLE tb_gym_exercises DROP COLUMN IF EXISTS user_id;
ALTER TABLE tb_gym_exercises DROP COLUMN IF EXISTS created_at;
ALTER TABLE tb_gym_exercises DROP COLUMN IF EXISTS updated_at;

ALTER TABLE tb_gym_workouts DROP COLUMN IF EXISTS user_id;
ALTER TABLE tb_gym_workouts DROP COLUMN IF EXISTS created_at;
ALTER TABLE tb_gym_workouts DROP COLUMN IF EXISTS updated_at;

DROP INDEX IF EXISTS idx_gym_exercises_user_workout;
DROP INDEX IF EXISTS idx_gym_workouts_user_id;

-- Only drop the function if no other triggers reference it
-- (check V4-V6 rollbacks first before dropping)
-- DROP FUNCTION IF EXISTS shared_set_updated_at();

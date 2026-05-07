-- Rollback V2: Remove FK constraint and NOT NULL constraints added in V2.
-- Run manually if V2 needs to be reverted.

ALTER TABLE tb_gym_exercises DROP CONSTRAINT IF EXISTS fk_exercises_workout;

ALTER TABLE tb_gym_workouts    ALTER COLUMN name         DROP NOT NULL;
ALTER TABLE tb_gym_exercises   ALTER COLUMN workout_id   DROP NOT NULL;
ALTER TABLE tb_gym_exercises   ALTER COLUMN name         DROP NOT NULL;
ALTER TABLE tb_fuel_records    ALTER COLUMN total_value  DROP NOT NULL;
ALTER TABLE tb_fuel_records    ALTER COLUMN price_per_liter DROP NOT NULL;
ALTER TABLE tb_fuel_records    ALTER COLUMN odometer     DROP NOT NULL;
ALTER TABLE tb_routine_tasks   ALTER COLUMN title        DROP NOT NULL;

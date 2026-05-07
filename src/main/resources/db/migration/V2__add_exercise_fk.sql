-- V2: Add FK constraint on tb_gym_exercises.workout_id + NOT NULL on required fields.

-- Remove orphaned exercises that reference non-existent workouts
DELETE FROM tb_gym_exercises
WHERE workout_id IS NOT NULL
  AND workout_id NOT IN (SELECT id FROM tb_gym_workouts);

-- Add FK: exercises cascade-delete when parent workout is deleted
ALTER TABLE tb_gym_exercises
    ADD CONSTRAINT fk_exercises_workout
        FOREIGN KEY (workout_id)
            REFERENCES tb_gym_workouts (id)
            ON DELETE CASCADE;

-- NOT NULL constraints on required business fields
ALTER TABLE tb_gym_workouts
    ALTER COLUMN name SET NOT NULL;

ALTER TABLE tb_gym_exercises
    ALTER COLUMN workout_id SET NOT NULL,
    ALTER COLUMN name SET NOT NULL;

ALTER TABLE tb_fuel_records
    ALTER COLUMN total_value     SET NOT NULL,
    ALTER COLUMN price_per_liter SET NOT NULL,
    ALTER COLUMN odometer        SET NOT NULL;

ALTER TABLE tb_routine_tasks
    ALTER COLUMN title SET NOT NULL;

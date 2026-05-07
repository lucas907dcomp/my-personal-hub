-- V3: Add user_id + audit timestamps to gym tables.
-- user_id is NULLABLE at this stage — existing rows have no owner yet.
-- NOT NULL enforced in Sprint 1 after first-user data assignment.

-- Shared trigger function (created once, reused by all tables)
CREATE OR REPLACE FUNCTION shared_set_updated_at()
    RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- tb_gym_workouts
ALTER TABLE tb_gym_workouts
    ADD COLUMN user_id    UUID,
    ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX idx_gym_workouts_user_id
    ON tb_gym_workouts (user_id);

CREATE TRIGGER trg_gym_workouts_updated_at
    BEFORE UPDATE ON tb_gym_workouts
    FOR EACH ROW EXECUTE FUNCTION shared_set_updated_at();

-- tb_gym_exercises
ALTER TABLE tb_gym_exercises
    ADD COLUMN user_id    UUID,
    ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX idx_gym_exercises_user_workout
    ON tb_gym_exercises (user_id, workout_id);

CREATE TRIGGER trg_gym_exercises_updated_at
    BEFORE UPDATE ON tb_gym_exercises
    FOR EACH ROW EXECUTE FUNCTION shared_set_updated_at();

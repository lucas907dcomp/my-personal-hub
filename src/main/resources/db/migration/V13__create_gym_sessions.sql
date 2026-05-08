-- ADR-022: Append-only gym session log for performance tracking
CREATE TABLE tb_gym_sessions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID         NOT NULL,
    exercise_id UUID         NOT NULL REFERENCES tb_gym_exercises(id) ON DELETE CASCADE,
    logged_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    weight      NUMERIC(8,2),
    reps        VARCHAR(20),
    rpe         INTEGER,
    CONSTRAINT chk_sessions_rpe CHECK (rpe IS NULL OR rpe BETWEEN 1 AND 10)
);

CREATE INDEX idx_gym_sessions_exercise ON tb_gym_sessions(exercise_id, logged_at DESC);
CREATE INDEX idx_gym_sessions_user    ON tb_gym_sessions(user_id);

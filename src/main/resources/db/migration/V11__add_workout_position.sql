-- V11: Add position column to tb_gym_workouts for user-controlled ordering.

BEGIN;

ALTER TABLE tb_gym_workouts
    ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0;

-- Assign initial positions based on creation order (ascending by id is approximate but deterministic)
WITH ordered AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY id) - 1 AS pos
    FROM tb_gym_workouts
)
UPDATE tb_gym_workouts
SET position = ordered.pos
FROM ordered
WHERE tb_gym_workouts.id = ordered.id;

COMMIT;

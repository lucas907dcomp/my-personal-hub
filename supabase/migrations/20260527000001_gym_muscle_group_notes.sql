-- STORY-015: muscle_group, position e notes
-- Apply manually in Supabase SQL editor if supabase CLI is not configured

-- Add muscle_group column to exercises (nullable, backward compatible)
ALTER TABLE tb_gym_exercises
  ADD COLUMN IF NOT EXISTS muscle_group text,
  ADD COLUMN IF NOT EXISTS position integer DEFAULT 0;

-- Add notes column to sessions (nullable, backward compatible)
ALTER TABLE tb_gym_sessions
  ADD COLUMN IF NOT EXISTS notes text;

-- Backfill position for existing exercises (preserve insertion order by id)
-- This assigns positions per workout based on existing row order
WITH ordered AS (
  SELECT id, workout_id,
         ROW_NUMBER() OVER (PARTITION BY workout_id ORDER BY created_at, id) - 1 AS pos
  FROM tb_gym_exercises
)
UPDATE tb_gym_exercises e
  SET position = o.pos
  FROM ordered o
  WHERE e.id = o.id AND e.position = 0;

-- ============================================================
-- Supabase RLS + RPC Setup — my-personal-hub
-- Run this once in the Supabase SQL Editor (project: scpltfevdqqvkbpnajuk)
-- ============================================================

-- ============================================================
-- 1. Enable Row Level Security on all tables
-- ============================================================
ALTER TABLE tb_gym_workouts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE tb_gym_exercises     ENABLE ROW LEVEL SECURITY;
ALTER TABLE tb_gym_supplements   ENABLE ROW LEVEL SECURITY;
ALTER TABLE tb_fuel_records      ENABLE ROW LEVEL SECURITY;
ALTER TABLE tb_routine_tasks     ENABLE ROW LEVEL SECURITY;
ALTER TABLE tb_workspace_notes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE tb_gym_sessions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE tb_daily_completions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. RLS Policies — each user can only access their own rows
-- ============================================================
CREATE POLICY "user_workouts"    ON tb_gym_workouts      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_exercises"   ON tb_gym_exercises     FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_supplements" ON tb_gym_supplements   FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_fuel"        ON tb_fuel_records      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_tasks"       ON tb_routine_tasks     FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_notes"       ON tb_workspace_notes   FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_sessions"    ON tb_gym_sessions      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_completions" ON tb_daily_completions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 3. RPC: reset_daily_routine()
--    Replaces POST /api/v1/productivity/tasks/reset
--    Calculates completion %, saves to daily_completions,
--    resets recurring tasks, deletes done one-shot tasks.
-- ============================================================
CREATE OR REPLACE FUNCTION reset_daily_routine()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_uid  UUID := auth.uid();
  v_total INT;
  v_done  INT;
  v_pct   INT;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE done = true)
  INTO v_total, v_done
  FROM tb_routine_tasks
  WHERE user_id = v_uid;

  v_pct := CASE WHEN v_total > 0 THEN ROUND((v_done::FLOAT / v_total) * 100) ELSE 0 END;

  INSERT INTO tb_daily_completions (user_id, completion_date, completion_percentage)
  VALUES (v_uid, CURRENT_DATE, v_pct)
  ON CONFLICT (user_id, completion_date) DO UPDATE
    SET completion_percentage = EXCLUDED.completion_percentage;

  UPDATE tb_routine_tasks SET done = false
  WHERE user_id = v_uid AND is_recurring = true;

  DELETE FROM tb_routine_tasks
  WHERE user_id = v_uid AND is_recurring = false AND done = true;
END;
$$;

-- ============================================================
-- 4. RPC: get_streak()
--    Replaces GET /api/v1/productivity/streak
--    Returns { currentStreak, totalDays }
-- ============================================================
CREATE OR REPLACE FUNCTION get_streak()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_uid         UUID := auth.uid();
  v_streak      INT  := 0;
  v_total       INT;
  v_most_recent DATE;
  v_expected    DATE;
  r             RECORD;
BEGIN
  SELECT COUNT(*) INTO v_total
  FROM tb_daily_completions
  WHERE user_id = v_uid;

  IF v_total = 0 THEN
    RETURN json_build_object('currentStreak', 0, 'totalDays', 0);
  END IF;

  SELECT completion_date INTO v_most_recent
  FROM tb_daily_completions
  WHERE user_id = v_uid
  ORDER BY completion_date DESC
  LIMIT 1;

  -- If today was already recorded, start counting from today; otherwise from yesterday
  v_expected := CASE WHEN v_most_recent = CURRENT_DATE THEN CURRENT_DATE ELSE CURRENT_DATE - 1 END;

  FOR r IN
    SELECT completion_date, completion_percentage
    FROM tb_daily_completions
    WHERE user_id = v_uid
    ORDER BY completion_date DESC
  LOOP
    EXIT WHEN r.completion_date <> v_expected;
    EXIT WHEN r.completion_percentage < 100;
    v_streak   := v_streak + 1;
    v_expected := v_expected - 1;
  END LOOP;

  RETURN json_build_object('currentStreak', v_streak, 'totalDays', v_total);
END;
$$;

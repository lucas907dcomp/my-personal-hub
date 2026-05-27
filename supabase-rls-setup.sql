-- ============================================================
-- Supabase Complete Setup — my-personal-hub
-- Run this once in the Supabase SQL Editor
-- Projeto: scpltfevdqqvkbpnajuk
--
-- PART 1: Create schema (tables, indexes, triggers)
-- PART 2: Enable RLS + policies
-- PART 3: RPC functions (reset_daily_routine, get_streak)
-- ============================================================


-- ============================================================
-- PART 1 — SCHEMA
-- ============================================================

-- Shared trigger function for updated_at
CREATE OR REPLACE FUNCTION shared_set_updated_at()
    RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------
-- tb_gym_workouts
-- ----------------------------
CREATE TABLE IF NOT EXISTS tb_gym_workouts (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(255) NOT NULL,
    user_id    UUID        NOT NULL,
    position   INTEGER     NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gym_workouts_user_id ON tb_gym_workouts (user_id);

DROP TRIGGER IF EXISTS trg_gym_workouts_updated_at ON tb_gym_workouts;
CREATE TRIGGER trg_gym_workouts_updated_at
    BEFORE UPDATE ON tb_gym_workouts
    FOR EACH ROW EXECUTE FUNCTION shared_set_updated_at();

-- ----------------------------
-- tb_gym_exercises
-- ----------------------------
CREATE TABLE IF NOT EXISTS tb_gym_exercises (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_id        UUID        NOT NULL REFERENCES tb_gym_workouts(id) ON DELETE CASCADE,
    user_id           UUID        NOT NULL,
    name              VARCHAR(255) NOT NULL,
    weight            FLOAT8      NOT NULL DEFAULT 0,
    reps              VARCHAR(255) NOT NULL,
    rpe               INTEGER,
    can_increase_next BOOLEAN     NOT NULL DEFAULT false,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_exercises_rpe CHECK (rpe IS NULL OR rpe BETWEEN 1 AND 10)
);

CREATE INDEX IF NOT EXISTS idx_gym_exercises_user_workout ON tb_gym_exercises (user_id, workout_id);

DROP TRIGGER IF EXISTS trg_gym_exercises_updated_at ON tb_gym_exercises;
CREATE TRIGGER trg_gym_exercises_updated_at
    BEFORE UPDATE ON tb_gym_exercises
    FOR EACH ROW EXECUTE FUNCTION shared_set_updated_at();

-- ----------------------------
-- tb_gym_supplements  (user_id is PK — one row per user)
-- ----------------------------
CREATE TABLE IF NOT EXISTS tb_gym_supplements (
    user_id    UUID    PRIMARY KEY,
    whey       BOOLEAN NOT NULL DEFAULT false,
    creatina   BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_gym_supplements_updated_at ON tb_gym_supplements;
CREATE TRIGGER trg_gym_supplements_updated_at
    BEFORE UPDATE ON tb_gym_supplements
    FOR EACH ROW EXECUTE FUNCTION shared_set_updated_at();

-- ----------------------------
-- tb_gym_sessions
-- ----------------------------
CREATE TABLE IF NOT EXISTS tb_gym_sessions (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL,
    exercise_id UUID        NOT NULL REFERENCES tb_gym_exercises(id) ON DELETE CASCADE,
    logged_at   TIMESTAMP   NOT NULL DEFAULT NOW(),
    weight      NUMERIC(8,2),
    reps        VARCHAR(20),
    rpe         INTEGER,
    CONSTRAINT chk_sessions_rpe CHECK (rpe IS NULL OR rpe BETWEEN 1 AND 10)
);

CREATE INDEX IF NOT EXISTS idx_gym_sessions_exercise ON tb_gym_sessions (exercise_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_gym_sessions_user     ON tb_gym_sessions (user_id);

-- ----------------------------
-- tb_fuel_records
-- ----------------------------
CREATE TABLE IF NOT EXISTS tb_fuel_records (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID         NOT NULL,
    date            TIMESTAMP(6) NOT NULL,
    total_value     NUMERIC(10,2) NOT NULL,
    price_per_liter NUMERIC(10,2) NOT NULL,
    odometer        FLOAT8       NOT NULL,
    liters          NUMERIC(8,3) NOT NULL,
    fuel_type       VARCHAR(255) NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT chk_fuel_records_fuel_type CHECK (fuel_type IN ('Gasolina', 'Etanol', 'Diesel')),
    CONSTRAINT chk_fuel_records_positives CHECK (liters > 0 AND price_per_liter > 0 AND total_value > 0)
);

CREATE INDEX IF NOT EXISTS idx_fuel_records_user_id   ON tb_fuel_records (user_id);
CREATE INDEX IF NOT EXISTS idx_fuel_records_user_date ON tb_fuel_records (user_id, date);

DROP TRIGGER IF EXISTS trg_fuel_records_updated_at ON tb_fuel_records;
CREATE TRIGGER trg_fuel_records_updated_at
    BEFORE UPDATE ON tb_fuel_records
    FOR EACH ROW EXECUTE FUNCTION shared_set_updated_at();

-- ----------------------------
-- tb_routine_tasks
-- ----------------------------
CREATE TABLE IF NOT EXISTS tb_routine_tasks (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL,
    title        VARCHAR(255) NOT NULL,
    time         VARCHAR(255),
    done         BOOLEAN     NOT NULL DEFAULT false,
    type         VARCHAR(255),
    is_recurring BOOLEAN     NOT NULL DEFAULT true,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_routine_tasks_user_id ON tb_routine_tasks (user_id);

DROP TRIGGER IF EXISTS trg_routine_tasks_updated_at ON tb_routine_tasks;
CREATE TRIGGER trg_routine_tasks_updated_at
    BEFORE UPDATE ON tb_routine_tasks
    FOR EACH ROW EXECUTE FUNCTION shared_set_updated_at();

-- ----------------------------
-- tb_workspace_notes  (user_id is PK — one row per user)
-- ----------------------------
CREATE TABLE IF NOT EXISTS tb_workspace_notes (
    user_id    UUID PRIMARY KEY,
    content    TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_workspace_notes_updated_at ON tb_workspace_notes;
CREATE TRIGGER trg_workspace_notes_updated_at
    BEFORE UPDATE ON tb_workspace_notes
    FOR EACH ROW EXECUTE FUNCTION shared_set_updated_at();

-- ----------------------------
-- tb_daily_completions
-- ----------------------------
CREATE TABLE IF NOT EXISTS tb_daily_completions (
    user_id               UUID    NOT NULL,
    completion_date       DATE    NOT NULL DEFAULT CURRENT_DATE,
    completion_percentage INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, completion_date),
    CONSTRAINT chk_completion_pct CHECK (completion_percentage BETWEEN 0 AND 100)
);

CREATE INDEX IF NOT EXISTS idx_daily_completions_user ON tb_daily_completions (user_id, completion_date DESC);

-- ----------------------------
-- tb_user_settings  (user_id is PK — one row per user)
-- ----------------------------
CREATE TABLE IF NOT EXISTS tb_user_settings (
    user_id         UUID PRIMARY KEY,
    last_reset_date DATE NOT NULL DEFAULT CURRENT_DATE,
    timezone        VARCHAR(50) NOT NULL DEFAULT 'America/Sao_Paulo',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_user_settings_updated_at ON tb_user_settings;
CREATE TRIGGER trg_user_settings_updated_at
    BEFORE UPDATE ON tb_user_settings
    FOR EACH ROW EXECUTE FUNCTION shared_set_updated_at();

-- ----------------------------
-- tb_agenda_events
-- ----------------------------
CREATE TABLE IF NOT EXISTS tb_agenda_events (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID         NOT NULL,
    title            VARCHAR(255) NOT NULL,
    description      TEXT,
    event_date       DATE         NOT NULL,
    event_time       TIME,
    reminder_minutes INTEGER,
    completed        BOOLEAN      NOT NULL DEFAULT false,
    color            VARCHAR(20),
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT chk_agenda_reminder CHECK (reminder_minutes IS NULL OR reminder_minutes >= 0)
);

CREATE INDEX IF NOT EXISTS idx_agenda_events_user_date ON tb_agenda_events (user_id, event_date);

DROP TRIGGER IF EXISTS trg_agenda_events_updated_at ON tb_agenda_events;
CREATE TRIGGER trg_agenda_events_updated_at
    BEFORE UPDATE ON tb_agenda_events
    FOR EACH ROW EXECUTE FUNCTION shared_set_updated_at();


-- ============================================================
-- PART 2 — ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE tb_gym_workouts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE tb_gym_exercises     ENABLE ROW LEVEL SECURITY;
ALTER TABLE tb_gym_supplements   ENABLE ROW LEVEL SECURITY;
ALTER TABLE tb_fuel_records      ENABLE ROW LEVEL SECURITY;
ALTER TABLE tb_routine_tasks     ENABLE ROW LEVEL SECURITY;
ALTER TABLE tb_workspace_notes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE tb_gym_sessions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE tb_daily_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_workouts"    ON tb_gym_workouts      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_exercises"   ON tb_gym_exercises     FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_supplements" ON tb_gym_supplements   FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_fuel"        ON tb_fuel_records      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_tasks"       ON tb_routine_tasks     FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_notes"       ON tb_workspace_notes   FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_sessions"    ON tb_gym_sessions      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_completions" ON tb_daily_completions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
ALTER TABLE tb_user_settings      ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_settings"    ON tb_user_settings      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
ALTER TABLE tb_agenda_events      ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_agenda"      ON tb_agenda_events      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- PART 3 — RPC FUNCTIONS
-- ============================================================

-- reset_daily_routine(): manual reset — também sincroniza last_reset_date em tb_user_settings
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

  -- Sincronizar last_reset_date (impede auto-reset disparar novamente hoje)
  INSERT INTO tb_user_settings (user_id, last_reset_date)
  VALUES (v_uid, CURRENT_DATE)
  ON CONFLICT (user_id) DO UPDATE
    SET last_reset_date = CURRENT_DATE, updated_at = now();
END;
$$;

-- check_and_auto_reset(): chamado no mount de useProductivityTasks — idempotente
CREATE OR REPLACE FUNCTION check_and_auto_reset()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_uid         UUID := auth.uid();
  v_last_reset  DATE;
  v_today       DATE := CURRENT_DATE;
  v_total       INT;
  v_done        INT;
  v_pct         INT;
BEGIN
  SELECT last_reset_date INTO v_last_reset
  FROM tb_user_settings WHERE user_id = v_uid;

  -- Primeiro acesso: criar settings com today e não resetar
  IF v_last_reset IS NULL THEN
    INSERT INTO tb_user_settings (user_id, last_reset_date)
    VALUES (v_uid, v_today)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN;
  END IF;

  -- Já resetou hoje → nada a fazer
  IF v_last_reset >= v_today THEN RETURN; END IF;

  -- Calcular completion% do dia que passou
  SELECT COUNT(*), COUNT(*) FILTER (WHERE done = true)
  INTO v_total, v_done
  FROM tb_routine_tasks WHERE user_id = v_uid;

  v_pct := CASE WHEN v_total > 0 THEN ROUND((v_done::FLOAT / v_total) * 100) ELSE 0 END;

  -- Salvar para o dia anterior (v_last_reset), não para hoje
  INSERT INTO tb_daily_completions (user_id, completion_date, completion_percentage)
  VALUES (v_uid, v_last_reset, v_pct)
  ON CONFLICT (user_id, completion_date) DO UPDATE
    SET completion_percentage = EXCLUDED.completion_percentage;

  -- Resetar tasks
  UPDATE tb_routine_tasks SET done = false
  WHERE user_id = v_uid AND is_recurring = true;

  DELETE FROM tb_routine_tasks
  WHERE user_id = v_uid AND is_recurring = false AND done = true;

  -- Marcar que resetou hoje
  UPDATE tb_user_settings
  SET last_reset_date = v_today, updated_at = now()
  WHERE user_id = v_uid;
END;
$$;

-- get_streak(): replaces GET /api/v1/productivity/streak
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
  FROM tb_daily_completions WHERE user_id = v_uid;

  IF v_total = 0 THEN
    RETURN json_build_object('currentStreak', 0, 'totalDays', 0);
  END IF;

  SELECT completion_date INTO v_most_recent
  FROM tb_daily_completions WHERE user_id = v_uid
  ORDER BY completion_date DESC LIMIT 1;

  v_expected := CASE WHEN v_most_recent = CURRENT_DATE THEN CURRENT_DATE ELSE CURRENT_DATE - 1 END;

  FOR r IN
    SELECT completion_date, completion_percentage
    FROM tb_daily_completions WHERE user_id = v_uid
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

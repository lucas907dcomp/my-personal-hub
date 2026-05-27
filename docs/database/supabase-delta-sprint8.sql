-- ============================================================
-- Supabase Delta — Sprint 8 (STORY-009)
-- Execute no Supabase SQL Editor para este sprint
-- ============================================================

-- 1. Nova tabela tb_user_settings
CREATE TABLE IF NOT EXISTS tb_user_settings (
    user_id         UUID PRIMARY KEY,
    last_reset_date DATE NOT NULL DEFAULT CURRENT_DATE,
    timezone        VARCHAR(50) NOT NULL DEFAULT 'America/Sao_Paulo',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE tb_user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_settings" ON tb_user_settings
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_user_settings_updated_at ON tb_user_settings;
CREATE TRIGGER trg_user_settings_updated_at
    BEFORE UPDATE ON tb_user_settings
    FOR EACH ROW EXECUTE FUNCTION shared_set_updated_at();

-- 2. RPC: check_and_auto_reset
--    Chamada no mount de useProductivityTasks.
--    Idempotente: se last_reset_date >= hoje, retorna sem fazer nada.
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

  -- Sem registro: criar settings com today e não resetar
  -- (não queremos resetar um usuário na primeira vez)
  IF v_last_reset IS NULL THEN
    INSERT INTO tb_user_settings (user_id, last_reset_date)
    VALUES (v_uid, v_today)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN;
  END IF;

  -- Já resetou hoje ou data futura → nada a fazer
  IF v_last_reset >= v_today THEN RETURN; END IF;

  -- Calcular completion% do dia anterior (estado atual = tasks de ontem)
  SELECT COUNT(*), COUNT(*) FILTER (WHERE done = true)
  INTO v_total, v_done
  FROM tb_routine_tasks WHERE user_id = v_uid;

  v_pct := CASE WHEN v_total > 0 THEN ROUND((v_done::FLOAT / v_total) * 100) ELSE 0 END;

  -- Salvar para v_last_reset (o dia que passou), não para hoje
  INSERT INTO tb_daily_completions (user_id, completion_date, completion_percentage)
  VALUES (v_uid, v_last_reset, v_pct)
  ON CONFLICT (user_id, completion_date) DO UPDATE
    SET completion_percentage = EXCLUDED.completion_percentage;

  -- Resetar tasks recorrentes
  UPDATE tb_routine_tasks SET done = false
  WHERE user_id = v_uid AND is_recurring = true;

  -- Deletar tasks pontuais concluídas
  DELETE FROM tb_routine_tasks
  WHERE user_id = v_uid AND is_recurring = false AND done = true;

  -- Atualizar last_reset_date para hoje
  UPDATE tb_user_settings
  SET last_reset_date = v_today, updated_at = now()
  WHERE user_id = v_uid;
END;
$$;

-- 3. Atualizar reset_daily_routine para também gravar last_reset_date
--    (reset manual também sincroniza o controle de auto-reset)
CREATE OR REPLACE FUNCTION reset_daily_routine()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_uid   UUID := auth.uid();
  v_total INT;
  v_done  INT;
  v_pct   INT;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE done = true)
  INTO v_total, v_done
  FROM tb_routine_tasks WHERE user_id = v_uid;

  v_pct := CASE WHEN v_total > 0 THEN ROUND((v_done::FLOAT / v_total) * 100) ELSE 0 END;

  INSERT INTO tb_daily_completions (user_id, completion_date, completion_percentage)
  VALUES (v_uid, CURRENT_DATE, v_pct)
  ON CONFLICT (user_id, completion_date) DO UPDATE
    SET completion_percentage = EXCLUDED.completion_percentage;

  UPDATE tb_routine_tasks SET done = false
  WHERE user_id = v_uid AND is_recurring = true;

  DELETE FROM tb_routine_tasks
  WHERE user_id = v_uid AND is_recurring = false AND done = true;

  -- Sincronizar last_reset_date para que auto-reset não dispare novamente hoje
  INSERT INTO tb_user_settings (user_id, last_reset_date)
  VALUES (v_uid, CURRENT_DATE)
  ON CONFLICT (user_id) DO UPDATE
    SET last_reset_date = CURRENT_DATE, updated_at = now();
END;
$$;

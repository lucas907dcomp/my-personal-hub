-- ============================================================
-- Supabase Delta — Sprint 9 (STORY-010)
-- Execute no Supabase SQL Editor para este sprint
-- ============================================================

-- 1. Nova tabela tb_agenda_events
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

ALTER TABLE tb_agenda_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_agenda" ON tb_agenda_events
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_agenda_events_updated_at ON tb_agenda_events;
CREATE TRIGGER trg_agenda_events_updated_at
    BEFORE UPDATE ON tb_agenda_events
    FOR EACH ROW EXECUTE FUNCTION shared_set_updated_at();

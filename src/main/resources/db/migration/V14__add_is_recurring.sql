-- ADR-023: Distinguish recurring tasks (daily routine) from one-shot tasks
ALTER TABLE tb_routine_tasks
    ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT TRUE;

-- Rollback V6: Remove user_id, timestamps, trigger and index from tb_workspace_notes.

DROP TRIGGER IF EXISTS trg_workspace_notes_updated_at ON tb_workspace_notes;

ALTER TABLE tb_workspace_notes DROP COLUMN IF EXISTS user_id;
ALTER TABLE tb_workspace_notes DROP COLUMN IF EXISTS created_at;
ALTER TABLE tb_workspace_notes DROP COLUMN IF EXISTS updated_at;

DROP INDEX IF EXISTS idx_workspace_notes_user_id;

-- After all V3-V6 triggers are rolled back, drop the shared function:
DROP FUNCTION IF EXISTS shared_set_updated_at();

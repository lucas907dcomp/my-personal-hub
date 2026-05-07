-- V6: Add user_id to tb_workspace_notes — preparing for per-user scratch pads.
-- The integer id=1 singleton PK is preserved at this stage (entity unchanged).
-- Sprint 1 will update the entity to support per-user notes.

ALTER TABLE tb_workspace_notes
    ADD COLUMN user_id    UUID,
    ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX idx_workspace_notes_user_id
    ON tb_workspace_notes (user_id);

CREATE TRIGGER trg_workspace_notes_updated_at
    BEFORE UPDATE ON tb_workspace_notes
    FOR EACH ROW EXECUTE FUNCTION shared_set_updated_at();

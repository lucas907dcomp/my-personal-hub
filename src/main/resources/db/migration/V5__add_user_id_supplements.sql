-- V5: Add user_id to tb_gym_supplements — preparing for per-user supplement goals.
-- The integer id=1 singleton PK is preserved at this stage (entity unchanged).
-- Sprint 1 will update the entity and application logic to support per-user records.

ALTER TABLE tb_gym_supplements
    ADD COLUMN user_id    UUID,
    ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX idx_gym_supplements_user_id
    ON tb_gym_supplements (user_id);

CREATE TRIGGER trg_gym_supplements_updated_at
    BEFORE UPDATE ON tb_gym_supplements
    FOR EACH ROW EXECUTE FUNCTION shared_set_updated_at();

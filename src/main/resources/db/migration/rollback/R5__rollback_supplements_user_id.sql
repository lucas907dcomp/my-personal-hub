-- Rollback V5: Remove user_id, timestamps, trigger and index from tb_gym_supplements.

DROP TRIGGER IF EXISTS trg_gym_supplements_updated_at ON tb_gym_supplements;

ALTER TABLE tb_gym_supplements DROP COLUMN IF EXISTS user_id;
ALTER TABLE tb_gym_supplements DROP COLUMN IF EXISTS created_at;
ALTER TABLE tb_gym_supplements DROP COLUMN IF EXISTS updated_at;

DROP INDEX IF EXISTS idx_gym_supplements_user_id;

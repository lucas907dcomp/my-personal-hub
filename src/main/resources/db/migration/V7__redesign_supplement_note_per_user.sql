-- V7: Replace singleton id=1 pattern with per-user rows
-- Deletes orphaned singleton rows (user_id IS NULL from the old id=1 pattern)
-- then promotes user_id to primary key

-- ==========================================
-- tb_gym_supplements redesign
-- ==========================================
DELETE FROM tb_gym_supplements WHERE user_id IS NULL;
ALTER TABLE tb_gym_supplements DROP CONSTRAINT tb_gym_supplements_pkey;
ALTER TABLE tb_gym_supplements DROP COLUMN id;
ALTER TABLE tb_gym_supplements ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE tb_gym_supplements ADD CONSTRAINT tb_gym_supplements_pkey PRIMARY KEY (user_id);

-- ==========================================
-- tb_workspace_notes redesign
-- ==========================================
DELETE FROM tb_workspace_notes WHERE user_id IS NULL;
ALTER TABLE tb_workspace_notes DROP CONSTRAINT tb_workspace_notes_pkey;
ALTER TABLE tb_workspace_notes DROP COLUMN id;
ALTER TABLE tb_workspace_notes ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE tb_workspace_notes ADD CONSTRAINT tb_workspace_notes_pkey PRIMARY KEY (user_id);

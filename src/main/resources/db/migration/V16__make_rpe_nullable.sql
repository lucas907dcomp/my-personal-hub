-- V9 set rpe NOT NULL with DEFAULT 8; V12 relaxed the CHECK but forgot to drop NOT NULL.
-- This completes ADR-017: rpe is fully optional.
ALTER TABLE tb_gym_exercises
    ALTER COLUMN rpe DROP NOT NULL,
    ALTER COLUMN rpe DROP DEFAULT;

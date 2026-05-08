-- ADR-017: Relax RPE constraint to allow NULL (optional RPE)
ALTER TABLE tb_gym_exercises
    DROP CONSTRAINT IF EXISTS chk_exercises_rpe;

ALTER TABLE tb_gym_exercises
    ADD CONSTRAINT chk_exercises_rpe
    CHECK (rpe IS NULL OR rpe BETWEEN 1 AND 10);

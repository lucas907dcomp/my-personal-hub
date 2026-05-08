-- V10: Add CHECK constraints for domain-level value enforcement.

BEGIN;

-- ==========================================
-- tb_gym_exercises: RPE must be 1–10
-- ==========================================
ALTER TABLE tb_gym_exercises
    ADD CONSTRAINT chk_exercises_rpe CHECK (rpe BETWEEN 1 AND 10);

-- ==========================================
-- tb_fuel_records: fuel_type PT-BR values (ADR-010)
-- ==========================================
ALTER TABLE tb_fuel_records
    ADD CONSTRAINT chk_fuel_records_fuel_type
    CHECK (fuel_type IN ('Gasolina', 'Etanol', 'Diesel'));

-- ==========================================
-- tb_fuel_records: positive monetary + quantity values
-- ==========================================
ALTER TABLE tb_fuel_records
    ADD CONSTRAINT chk_fuel_records_positives
    CHECK (liters > 0 AND price_per_liter > 0 AND total_value > 0);

COMMIT;

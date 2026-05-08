-- V8: Migrate tb_fuel_records monetary columns from FLOAT8 to NUMERIC.
-- Uses column-parallel approach (add → copy → verify → drop → rename) to preserve data.

BEGIN;

-- Step 1: Add new NUMERIC columns alongside existing FLOAT8 ones
ALTER TABLE tb_fuel_records
    ADD COLUMN total_value_n     NUMERIC(10,2),
    ADD COLUMN price_per_liter_n NUMERIC(10,2),
    ADD COLUMN liters_n          NUMERIC(8,3);

-- Step 2: Copy data with explicit rounding
UPDATE tb_fuel_records SET
    total_value_n     = ROUND(total_value::numeric, 2),
    price_per_liter_n = ROUND(price_per_liter::numeric, 2),
    liters_n          = ROUND(liters::numeric, 3)
WHERE total_value IS NOT NULL;

-- Step 3: Verify no data loss (NULL in new column while old column had a value)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM tb_fuel_records
        WHERE total_value_n IS NULL AND total_value IS NOT NULL
    ) THEN
        RAISE EXCEPTION 'V8 migration failed: total_value_n has NULLs where total_value was not NULL';
    END IF;
    IF EXISTS (
        SELECT 1 FROM tb_fuel_records
        WHERE price_per_liter_n IS NULL AND price_per_liter IS NOT NULL
    ) THEN
        RAISE EXCEPTION 'V8 migration failed: price_per_liter_n has NULLs where price_per_liter was not NULL';
    END IF;
END $$;

-- Step 4: Drop old FLOAT8 columns
ALTER TABLE tb_fuel_records
    DROP COLUMN total_value,
    DROP COLUMN price_per_liter,
    DROP COLUMN liters;

-- Step 5: Rename new NUMERIC columns to original names
ALTER TABLE tb_fuel_records RENAME COLUMN total_value_n     TO total_value;
ALTER TABLE tb_fuel_records RENAME COLUMN price_per_liter_n TO price_per_liter;
ALTER TABLE tb_fuel_records RENAME COLUMN liters_n          TO liters;

-- Step 6: Restore NOT NULL constraints (were NOT NULL before on monetary fields)
ALTER TABLE tb_fuel_records
    ALTER COLUMN total_value     SET NOT NULL,
    ALTER COLUMN price_per_liter SET NOT NULL;

COMMIT;

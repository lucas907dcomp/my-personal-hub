-- V1: Baseline schema — documents the state auto-created by ddl-auto=update.
-- This migration is baselined (not applied to existing DBs via flyway:baseline),
-- but applied from scratch on new environments.

CREATE TABLE IF NOT EXISTS tb_gym_workouts (
    id          UUID         NOT NULL,
    name        VARCHAR(255),
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS tb_gym_exercises (
    id                UUID         NOT NULL,
    workout_id        UUID,
    name              VARCHAR(255),
    weight            FLOAT8,
    reps              VARCHAR(255),
    rpe               INTEGER,
    can_increase_next BOOLEAN,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS tb_gym_supplements (
    id       INTEGER NOT NULL,
    whey     BOOLEAN,
    creatina BOOLEAN,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS tb_fuel_records (
    id              UUID NOT NULL,
    date            TIMESTAMP(6),
    total_value     FLOAT8,
    price_per_liter FLOAT8,
    odometer        FLOAT8,
    liters          FLOAT8,
    fuel_type       VARCHAR(255),
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS tb_routine_tasks (
    id    UUID         NOT NULL,
    title VARCHAR(255),
    time  VARCHAR(255),
    done  BOOLEAN,
    type  VARCHAR(255),
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS tb_workspace_notes (
    id      INTEGER NOT NULL,
    content TEXT,
    PRIMARY KEY (id)
);

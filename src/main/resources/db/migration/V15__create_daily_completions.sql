-- ADR-024: Daily completion history for streak gamification
CREATE TABLE tb_daily_completions (
    user_id               UUID    NOT NULL,
    completion_date       DATE    NOT NULL DEFAULT CURRENT_DATE,
    completion_percentage INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, completion_date),
    CONSTRAINT chk_completion_pct CHECK (completion_percentage BETWEEN 0 AND 100)
);

CREATE INDEX idx_daily_completions_user ON tb_daily_completions(user_id, completion_date DESC);

-- STORY-016: tb_body_weight e tb_supplement_config

-- Body weight tracker
CREATE TABLE IF NOT EXISTS tb_body_weight (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users NOT NULL,
  date        date NOT NULL DEFAULT CURRENT_DATE,
  weight_kg   numeric(5,2) NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE tb_body_weight ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tb_body_weight' AND policyname = 'users own body weight'
  ) THEN
    CREATE POLICY "users own body weight" ON tb_body_weight
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Dynamic supplement configuration per user
CREATE TABLE IF NOT EXISTS tb_supplement_config (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid REFERENCES auth.users NOT NULL,
  name             text NOT NULL,
  icon             text DEFAULT '💊',
  position         integer DEFAULT 0,
  last_taken_date  date,
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE tb_supplement_config ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tb_supplement_config' AND policyname = 'users own supplement config'
  ) THEN
    CREATE POLICY "users own supplement config" ON tb_supplement_config
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

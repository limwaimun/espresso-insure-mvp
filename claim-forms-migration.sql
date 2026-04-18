-- Create claim_forms table to store form metadata
CREATE TABLE IF NOT EXISTS claim_forms (
  id text PRIMARY KEY,
  insurer text NOT NULL,
  form_type text NOT NULL,
  form_name text NOT NULL,
  filename text NOT NULL,
  storage_url text,
  source_url text,
  file_size integer,
  last_fetched timestamptz,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE claim_forms ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read claim forms
CREATE POLICY "Authenticated users can read claim forms"
  ON claim_forms FOR SELECT
  TO authenticated
  USING (true);

-- Only service role can insert/update (harvester runs as service key)
CREATE POLICY "Service role can manage claim forms"
  ON claim_forms FOR ALL
  TO service_role
  USING (true);

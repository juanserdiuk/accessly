CREATE TABLE IF NOT EXISTS guest_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token      TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  label      TEXT NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE guest_tokens ENABLE ROW LEVEL SECURITY;

-- All operations go through the service role (admin client) which bypasses RLS.
-- This policy lets authenticated owners read their own tokens if ever queried
-- through the regular client.
CREATE POLICY "owner can read own tokens" ON guest_tokens
  FOR SELECT USING (auth.uid() = created_by);

CREATE INDEX IF NOT EXISTS guest_tokens_token_idx      ON guest_tokens(token);
CREATE INDEX IF NOT EXISTS guest_tokens_created_by_idx ON guest_tokens(created_by);

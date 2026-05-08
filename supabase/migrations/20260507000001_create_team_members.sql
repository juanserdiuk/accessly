CREATE TABLE IF NOT EXISTS team_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'member',
  status     TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(owner_id, email)
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners can read their team" ON team_members
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "owners can insert members" ON team_members
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "owners can delete members" ON team_members
  FOR DELETE USING (auth.uid() = owner_id);

CREATE INDEX IF NOT EXISTS team_members_owner_id_idx ON team_members(owner_id);

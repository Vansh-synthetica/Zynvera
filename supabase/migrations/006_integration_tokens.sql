-- =====================================================
-- INTEGRATION TOKENS
-- OAuth tokens for external services (Google Drive first).
-- Tokens are encrypted server-side before storage; RLS
-- limits rows to their owner.
-- =====================================================

CREATE TABLE integration_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google_drive', 'zoom', 'microsoft')),
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  expires_at TIMESTAMPTZ,
  scope TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

CREATE INDEX idx_integration_tokens_user ON integration_tokens(user_id);

ALTER TABLE integration_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own integration tokens" ON integration_tokens
  FOR ALL USING (user_id = auth.uid());

CREATE TRIGGER update_integration_tokens_updated_at BEFORE UPDATE ON integration_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

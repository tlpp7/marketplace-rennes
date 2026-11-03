-- Persisted login throttling and account verification state.
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at timestamptz;
CREATE TABLE IF NOT EXISTS auth_attempts (
  key_hash char(64) PRIMARY KEY,
  failures integer NOT NULL DEFAULT 0,
  window_started timestamptz NOT NULL DEFAULT now(),
  blocked_until timestamptz
);
CREATE TABLE IF NOT EXISTS account_tokens (
  token_hash char(64) PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind varchar(20) NOT NULL CHECK(kind IN ('verify','reset')),
  expires_at timestamptz NOT NULL,
  used_at timestamptz
);
CREATE INDEX IF NOT EXISTS account_tokens_user_idx ON account_tokens(user_id);

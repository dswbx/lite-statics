-- OAuth flow state (supabase/lite social logins). Additive so existing D1
-- databases that already applied the init auth schema still get this table.
CREATE TABLE IF NOT EXISTS auth.flow_state (
  id                     uuid PRIMARY KEY,
  user_id                uuid,
  auth_code              text,
  authentication_method  text NOT NULL,
  code_challenge_method  text CHECK (code_challenge_method IN ('s256', 'plain')),
  code_challenge         text,
  provider_type          text NOT NULL,
  provider_access_token  text,
  provider_refresh_token text,
  auth_code_issued_at    timestamptz,
  invite_token           text,
  referrer               text,
  oauth_client_state_id  uuid,
  linking_target_id      uuid,
  email_optional         boolean NOT NULL DEFAULT false,
  created_at             timestamptz DEFAULT now(),
  updated_at             timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_code ON auth.flow_state (auth_code);
CREATE INDEX IF NOT EXISTS idx_user_id_auth_method ON auth.flow_state (user_id, authentication_method);
CREATE INDEX IF NOT EXISTS flow_state_created_at_idx ON auth.flow_state (created_at);

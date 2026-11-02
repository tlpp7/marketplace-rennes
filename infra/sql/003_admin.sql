CREATE TABLE IF NOT EXISTS platform_admins(user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,created_at timestamptz NOT NULL DEFAULT now());
CREATE SEQUENCE IF NOT EXISTS rennfripes_sku_seq START 1;

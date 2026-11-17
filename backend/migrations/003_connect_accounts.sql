-- 003: Stripe Connect, step 1 (connected accounts)
--
-- Each user can connect their own Stripe account so clients pay them directly.
-- This only ADDS columns and an index. Existing rows get safe defaults
-- (no account, payments off), and the currently deployed code ignores them,
-- so it is safe to run before the new code is deployed.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS stripe_connect_account_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS connect_charges_enabled   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS connect_updated_at        TIMESTAMPTZ;

-- One Stripe account per user, and one user per Stripe account
CREATE UNIQUE INDEX IF NOT EXISTS users_stripe_connect_account_id_key
  ON users (stripe_connect_account_id)
  WHERE stripe_connect_account_id IS NOT NULL;
-- 004: Stripe Connect, step 2 (pay links and payment records)
--
-- Only ADDS things. Existing invoices keep working untouched:
--   * invoices.payment_token  random, unguessable id used in the public pay link.
--                             Created on demand the first time a link is needed.
--   * invoices.paid_via       how an invoice got paid: 'stripe' (online) or NULL
--                             (marked paid by hand, which is every existing invoice).
--   * payments                one row per card payment received through Stripe,
--                             kept for records and to make the webhook safe to repeat.

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS payment_token VARCHAR(64),
  ADD COLUMN IF NOT EXISTS paid_via      VARCHAR(20);

CREATE UNIQUE INDEX IF NOT EXISTS invoices_payment_token_key
  ON invoices (payment_token)
  WHERE payment_token IS NOT NULL;

CREATE TABLE IF NOT EXISTS payments (
  id                         BIGSERIAL PRIMARY KEY,
  invoice_id                 INT          NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
  user_id                    INT          NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  stripe_account_id          VARCHAR(255) NOT NULL,
  stripe_checkout_session_id VARCHAR(255) NOT NULL,
  stripe_payment_intent_id   VARCHAR(255),
  amount_cents               BIGINT       NOT NULL,
  application_fee_cents      BIGINT       NOT NULL DEFAULT 0,
  currency                   VARCHAR(10)  NOT NULL DEFAULT 'usd',
  status                     VARCHAR(30)  NOT NULL DEFAULT 'succeeded',
  note                       TEXT,
  created_at                 TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- The same Stripe payment can never be recorded twice
CREATE UNIQUE INDEX IF NOT EXISTS payments_checkout_session_key
  ON payments (stripe_checkout_session_id);
CREATE UNIQUE INDEX IF NOT EXISTS payments_payment_intent_key
  ON payments (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS payments_invoice_idx ON payments (invoice_id);
CREATE INDEX IF NOT EXISTS payments_user_idx    ON payments (user_id, created_at);
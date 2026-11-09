-- Users and billing
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    subscription_tier VARCHAR(50) NOT NULL DEFAULT 'unpaid'
        CHECK (subscription_tier IN ('unpaid', 'MONTHLY', 'YEARLY')),
    billing_status VARCHAR(50) NOT NULL DEFAULT 'inactive'
        CHECK (billing_status IN ('inactive', 'active', 'past_due')),
    stripe_customer_id VARCHAR(255) UNIQUE,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_users_email_lower ON users (lower(email));

-- Clients (per-user)
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),                -- store as E.164, e.g. +12015551234
    sms_opt_out BOOLEAN NOT NULL DEFAULT FALSE,
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, email),
    UNIQUE (id, user_id)                     -- target for the composite FK below
);

-- Invoices
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id INT NOT NULL,
    invoice_number VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'paid', 'void')),   -- match your real values
    due_date DATE NOT NULL,
    paid_at TIMESTAMPTZ,
    last_notified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, invoice_number),
    FOREIGN KEY (client_id, user_id)
        REFERENCES clients (id, user_id) ON DELETE RESTRICT
);

CREATE TABLE invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_amount_cents INT NOT NULL CHECK (unit_amount_cents >= 0)
);

-- Reminder / send history
CREATE TABLE communication_logs (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invoice_id INT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    channel VARCHAR(10) NOT NULL CHECK (channel IN ('email', 'sms')),
    recipient VARCHAR(255) NOT NULL,
    tone_tier VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'sent'
        CHECK (status IN ('queued', 'sent', 'delivered', 'failed')),
    provider_message_id VARCHAR(255),
    error TEXT,
    dispatched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Agent: proposed actions waiting for the user's confirmation
CREATE TABLE pending_actions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,        -- e.g. 'send_reminders'
    payload JSONB NOT NULL,                  -- exact recipients, channel, message
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'confirmed', 'executed', 'cancelled', 'expired', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '15 minutes'),
    resolved_at TIMESTAMPTZ
);

-- Stripe webhook idempotency
CREATE TABLE stripe_events (
    event_id VARCHAR(255) PRIMARY KEY,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_clients_user ON clients (user_id);
CREATE INDEX idx_invoices_user_status_due ON invoices (user_id, status, due_date);
CREATE INDEX idx_invoices_client ON invoices (client_id);
CREATE INDEX idx_items_invoice ON invoice_items (invoice_id);
CREATE INDEX idx_comm_invoice ON communication_logs (invoice_id, dispatched_at DESC);
CREATE INDEX idx_pending_user_status ON pending_actions (user_id, status);
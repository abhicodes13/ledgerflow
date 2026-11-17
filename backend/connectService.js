// =========================================================================
// STRIPE CONNECT: connected accounts (PR 1)
//
// Each LedgerFlow user can connect their own Stripe account. Stripe collects
// their identity and bank details on a Stripe-hosted page, so none of that
// ever touches our server. Later steps create a payment page for each invoice
// on that account, so the money goes straight to the user's bank.
//
// Setup: Accounts v2 API, "merchant" configuration with card payments, full
// Stripe Dashboard for the user, Stripe collects fees and manages risk (so
// we never hold anyone's money). Every Stripe call that depends on the exact
// shape of the v2 API is in this file, so a correction is a one-file change.
// =========================================================================
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const pool = require("./db");
const { AppError } = require("./errors");

const FRONTEND_URL = (
  process.env.FRONTEND_URL ||
  process.env.FRONTEND_PRODUCTION_URL ||
  "http://localhost:5173"
).replace(/\/+$/, "");

const SETTINGS_URL = `${FRONTEND_URL}/settings/payments`;

// Turns a Stripe error into one the user can see, and logs the real reason
function stripeProblem(error, action) {
  console.error(`Stripe error while trying to ${action}:`, error?.message);
  return new AppError(
    "We couldn't reach Stripe just now. Please try again in a moment.",
    502,
    "STRIPE_UNAVAILABLE",
  );
}

// Pure function (easy to test): what should the app show for this account?
//   not_connected         no Stripe account yet
//   onboarding_incomplete the user has not finished Stripe's form
//   restricted            Stripe needs something before payments work
//   active                the account can take card payments
function deriveStatus(account) {
  if (!account) {
    return {
      state: "not_connected",
      charges_enabled: false,
      card_payments_status: null,
      requirements_due: false,
    };
  }
  const cardStatus =
    account.configuration?.merchant?.capabilities?.card_payments?.status ||
    null;
  const chargesEnabled = cardStatus === "active";
  const entries = account.requirements?.entries;
  return {
    state: chargesEnabled
      ? "active"
      : cardStatus === "restricted"
        ? "restricted"
        : "onboarding_incomplete",
    charges_enabled: chargesEnabled,
    card_payments_status: cardStatus,
    // Active accounts can still have new information due later
    requirements_due: Array.isArray(entries) && entries.length > 0,
  };
}

// Returns this user's Stripe account id, creating the account the first time.
async function getOrCreateAccountId(userId) {
  const found = await pool.query(
    `SELECT id, email, username, stripe_connect_account_id
     FROM users WHERE id = $1`,
    [userId],
  );
  const user = found.rows[0];
  if (!user) throw new AppError("Account not found", 401);
  if (user.stripe_connect_account_id) return user.stripe_connect_account_id;

  let account;
  try {
    account = await stripe.v2.core.accounts.create(
      {
        contact_email: user.email,
        display_name: user.username,
        dashboard: "full",
        identity: { country: "us" },
        configuration: {
          merchant: { capabilities: { card_payments: { requested: true } } },
        },
        defaults: {
          currency: "usd",
          responsibilities: {
            fees_collector: "stripe",
            losses_collector: "stripe",
          },
          locales: ["en-US"],
        },
        metadata: { userId: String(userId) },
        include: ["configuration.merchant", "identity", "requirements"],
      },
      // A double-click or retry gets the same account back, not a second one
      { idempotencyKey: `connect-account-user-${userId}` },
    );
  } catch (error) {
    throw stripeProblem(error, "create a connected account");
  }

  // The first writer wins. If two requests raced, the loser reads the winner's id.
  const saved = await pool.query(
    `UPDATE users
     SET stripe_connect_account_id = $1, connect_updated_at = now(), updated_at = now()
     WHERE id = $2 AND stripe_connect_account_id IS NULL
     RETURNING stripe_connect_account_id`,
    [account.id, userId],
  );
  if (saved.rowCount > 0) return account.id;

  const again = await pool.query(
    "SELECT stripe_connect_account_id FROM users WHERE id = $1",
    [userId],
  );
  return again.rows[0].stripe_connect_account_id;
}

// A one-time Stripe-hosted onboarding link. The frontend redirects the browser
// to the returned url. Links expire quickly, so we make a fresh one on demand.
async function createOnboardingLink(userId) {
  const accountId = await getOrCreateAccountId(userId);
  try {
    const link = await stripe.v2.core.accountLinks.create({
      account: accountId,
      use_case: {
        type: "account_onboarding",
        account_onboarding: {
          // No "configurations" here: this account's API version rejects it as
          // an unknown field, and Stripe works out what to collect from the
          // account's own merchant configuration.
          refresh_url: `${SETTINGS_URL}?connect=refresh`,
          return_url: `${SETTINGS_URL}?connect=return`,
        },
      },
    });
    return link.url;
  } catch (error) {
    throw stripeProblem(error, "create an onboarding link");
  }
}

// Asks Stripe for the account's current state, and remembers whether it can
// take payments. Landing back on the return URL does NOT mean onboarding is
// finished, which is why the frontend calls this and reads the result.
async function getStatus(userId) {
  const found = await pool.query(
    `SELECT stripe_connect_account_id, connect_charges_enabled
     FROM users WHERE id = $1`,
    [userId],
  );
  const row = found.rows[0];
  if (!row) throw new AppError("Account not found", 401);
  if (!row.stripe_connect_account_id) return deriveStatus(null);

  let account;
  try {
    account = await stripe.v2.core.accounts.retrieve(
      row.stripe_connect_account_id,
      { include: ["configuration.merchant", "requirements"] },
    );
  } catch (error) {
    throw stripeProblem(error, "read the connected account");
  }

  const status = deriveStatus(account);
  if (status.charges_enabled !== row.connect_charges_enabled) {
    await pool.query(
      `UPDATE users SET connect_charges_enabled = $1, connect_updated_at = now(), updated_at = now()
       WHERE id = $2`,
      [status.charges_enabled, userId],
    );
  }
  return status;
}

module.exports = {
  getOrCreateAccountId,
  createOnboardingLink,
  getStatus,
  deriveStatus,
};

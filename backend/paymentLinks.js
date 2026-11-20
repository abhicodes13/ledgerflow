// =========================================================================
// PAY LINKS (Stripe Connect, PR 2)
//
// Every invoice can have a permanent public link:  <API>/pay/<token>
// The link goes in the invoice PDF and the reminder email. Stripe Checkout
// sessions expire after 24 hours, so the link does not point at one. Instead,
// opening it creates a FRESH Checkout Session on the user's connected account
// (a "direct charge": the money goes to the user, not through us) and sends
// the client's browser there.
//
// Whatever goes wrong, the client lands on a friendly page on our frontend:
//   <FRONTEND>/pay/result?status=success|cancelled|paid|void|unavailable|invalid
// =========================================================================
const crypto = require("crypto");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const pool = require("./db");
const { AppError } = require("./errors");

const FRONTEND_URL = (
  process.env.FRONTEND_URL ||
  process.env.FRONTEND_PRODUCTION_URL ||
  "http://localhost:5173"
).replace(/\/+$/, "");

// The public address of THIS backend, used to build the links we put in
// PDFs and emails (for example https://api.yourdomain.com)
const PUBLIC_API_URL = (process.env.PUBLIC_API_URL || "").replace(/\/+$/, "");

// Our cut of each payment, in percent. 0 at launch. Stripe's own processing
// fee is paid by the connected account either way.
const FEE_PERCENT = (() => {
  const n = Number(process.env.APPLICATION_FEE_PERCENT);
  return Number.isFinite(n) && n >= 0 && n <= 20 ? n : 0;
})();

const MIN_CHARGE_CENTS = 50; // Stripe cannot charge less than 50 cents
const TOKEN_RE = /^[A-Za-z0-9_-]{20,64}$/;
const EMAIL_RE = /^\S+@\S+\.\S+$/;

const newToken = () => crypto.randomBytes(24).toString("base64url"); // 192 bits
const feeFor = (cents) => Math.round((cents * FEE_PERCENT) / 100);
const resultUrl = (status) => `${FRONTEND_URL}/pay/result?status=${status}`;
const buildPayUrl = (token) =>
  PUBLIC_API_URL ? `${PUBLIC_API_URL}/pay/${token}` : null;

// Returns the invoice's token, creating it the first time one is needed.
async function ensurePaymentToken(invoiceId, userId, db = pool) {
  const read = () =>
    db.query(
      "SELECT payment_token FROM invoices WHERE id = $1 AND user_id = $2",
      [invoiceId, userId],
    );

  const existing = await read();
  if (!existing.rows[0]) throw new AppError("Invoice not found", 404);
  if (existing.rows[0].payment_token) return existing.rows[0].payment_token;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      // Only fills an empty token, so two requests at once end up agreeing
      const updated = await db.query(
        `UPDATE invoices SET payment_token = $1
         WHERE id = $2 AND user_id = $3 AND payment_token IS NULL
         RETURNING payment_token`,
        [newToken(), invoiceId, userId],
      );
      if (updated.rows[0]) return updated.rows[0].payment_token;
      const again = await read();
      if (again.rows[0]?.payment_token) return again.rows[0].payment_token;
    } catch (error) {
      if (error.code !== "23505") throw error; // a token collision: just try again
    }
  }
  throw new Error("Could not create a payment token");
}

// For the signed-in user (frontend "Copy payment link" button, PDF, email):
// is online payment possible for this invoice, and what is its link?
// -> { enabled, url, reason }  reason is set when enabled is false:
//    invoice_not_pending | payments_not_set_up | amount_too_small | not_configured
async function getInvoicePaymentLink(userId, invoiceId) {
  const result = await pool.query(
    `SELECT i.status, u.stripe_connect_account_id, u.connect_charges_enabled,
            COALESCE(SUM(ii.quantity * ii.unit_amount_cents), 0)::BIGINT AS total_cents
     FROM invoices i
     JOIN users u ON u.id = i.user_id
     LEFT JOIN invoice_items ii ON ii.invoice_id = i.id
     WHERE i.id = $1 AND i.user_id = $2
     GROUP BY i.id, u.id`,
    [invoiceId, userId],
  );
  const row = result.rows[0];
  if (!row) throw new AppError("Invoice not found", 404);

  const no = (reason) => ({ enabled: false, url: null, reason });
  if (row.status !== "pending") return no("invoice_not_pending");
  if (!row.stripe_connect_account_id || !row.connect_charges_enabled) {
    return no("payments_not_set_up");
  }
  if (Number(row.total_cents) < MIN_CHARGE_CENTS) return no("amount_too_small");
  if (!PUBLIC_API_URL) return no("not_configured");

  const token = await ensurePaymentToken(invoiceId, userId);
  return { enabled: true, url: buildPayUrl(token), reason: null };
}

// Called when a client opens the public link. Always returns a URL to send
// the browser to: Stripe's payment page, or a friendly result page of ours.
async function startCheckout(token) {
  if (!TOKEN_RE.test(String(token || ""))) return resultUrl("invalid");

  const result = await pool.query(
    `SELECT i.id, i.user_id, i.invoice_number, i.status,
            c.email AS client_email,
            u.stripe_connect_account_id, u.connect_charges_enabled,
            COALESCE(SUM(ii.quantity * ii.unit_amount_cents), 0)::BIGINT AS total_cents
     FROM invoices i
     JOIN clients c ON c.id = i.client_id AND c.user_id = i.user_id
     JOIN users u ON u.id = i.user_id
     LEFT JOIN invoice_items ii ON ii.invoice_id = i.id
     WHERE i.payment_token = $1
     GROUP BY i.id, c.id, u.id`,
    [token],
  );
  const row = result.rows[0];
  if (!row) return resultUrl("invalid");
  if (row.status === "paid") return resultUrl("paid");
  if (row.status === "void") return resultUrl("void");

  const total = Number(row.total_cents);
  if (
    !row.stripe_connect_account_id ||
    !row.connect_charges_enabled ||
    total < MIN_CHARGE_CENTS
  ) {
    return resultUrl("unavailable");
  }

  const fee = feeFor(total);
  const metadata = {
    invoice_id: String(row.id),
    user_id: String(row.user_id),
    fee_cents: String(fee),
  };

  try {
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: total,
              product_data: { name: `Invoice ${row.invoice_number}` },
            },
          },
        ],
        client_reference_id: String(row.id),
        ...(EMAIL_RE.test(row.client_email || "")
          ? { customer_email: row.client_email }
          : {}),
        metadata,
        payment_intent_data: {
          description: `Invoice ${row.invoice_number}`,
          metadata,
          // Stripe emails the client a receipt (live payments only). Setting it here
          // means it is sent even if the user never turned receipts on in their own
          // Stripe Dashboard. The receipt shows the user's business name, not ours.
          ...(EMAIL_RE.test(row.client_email || "")
            ? { receipt_email: row.client_email }
            : {}),
          ...(fee > 0 ? { application_fee_amount: fee } : {}),
        },
        success_url: resultUrl("success"),
        cancel_url: resultUrl("cancelled"),
      },
      // A direct charge: created ON the user's connected account
      { stripeAccount: row.stripe_connect_account_id },
    );
    return session.url;
  } catch (error) {
    console.error("Could not create a checkout session:", error.message);
    return resultUrl("unavailable");
  }
}

module.exports = {
  ensurePaymentToken,
  getInvoicePaymentLink,
  startCheckout,
  buildPayUrl,
  resultUrl,
  feeFor,
};

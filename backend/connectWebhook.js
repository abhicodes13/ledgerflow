// =========================================================================
// STRIPE CONNECT WEBHOOK
//
// A second webhook, separate from the subscription one in payment.js. It
// receives events about payments made to our users' CONNECTED accounts.
// Needs the RAW body, so server.js mounts it before express.json():
//   app.use("/api/payment/connect-webhook", connectWebhookRouter);
//
// When a client pays an invoice, Stripe sends checkout.session.completed.
// We then, in ONE database transaction:
//   1. record the event id (so a repeated delivery is ignored),
//   2. save a row in payments,
//   3. mark the invoice paid (paid_at, paid_via = 'stripe').
// Failures return 500 so Stripe retries.
// =========================================================================
const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const pool = require("./db");

const router = express.Router();

if (!process.env.STRIPE_CONNECT_WEBHOOK_SECRET) {
  console.warn(
    "STRIPE_CONNECT_WEBHOOK_SECRET is not set: online invoice payments cannot be confirmed until it is.",
  );
}

const HANDLED = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
]);

router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const secret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;
    if (!secret) {
      console.error(
        "Connect webhook called but STRIPE_CONNECT_WEBHOOK_SECRET is missing",
      );
      return res.status(500).json({ error: "Webhook is not configured" });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        req.headers["stripe-signature"],
        secret,
      );
    } catch (error) {
      console.error("Connect webhook signature check failed:", error.message);
      return res.status(400).send("Webhook signature verification failed");
    }

    if (!HANDLED.has(event.type)) return res.json({ received: true });

    const session = event.data.object;
    const accountId = event.account; // the connected account the payment was made on

    // Only a fully paid session counts (some payment methods settle later)
    if (!accountId || session.payment_status !== "paid") {
      return res.json({ received: true, ignored: true });
    }

    let db;
    try {
      db = await pool.connect();
      await db.query("BEGIN");

      const recorded = await db.query(
        "INSERT INTO stripe_events (event_id) VALUES ($1) ON CONFLICT DO NOTHING RETURNING event_id",
        [event.id],
      );
      if (recorded.rowCount === 0) {
        await db.query("ROLLBACK");
        return res.json({ received: true, duplicate: true });
      }

      const invoiceId = Number(session.metadata?.invoice_id);
      const invoice = Number.isInteger(invoiceId)
        ? (
            await db.query(
              `SELECT i.id, i.user_id, i.status,
                    COALESCE(SUM(ii.quantity * ii.unit_amount_cents), 0)::BIGINT AS total_cents
             FROM invoices i
             JOIN users u ON u.id = i.user_id
             LEFT JOIN invoice_items ii ON ii.invoice_id = i.id
             WHERE i.id = $1 AND u.stripe_connect_account_id = $2
             GROUP BY i.id`,
              [invoiceId, accountId],
            )
          ).rows[0]
        : null;

      if (!invoice) {
        // Not one of ours (or the account doesn't match): acknowledge, don't retry
        console.warn(
          `Connect event ${event.id}: no matching invoice for account ${accountId}`,
        );
        await db.query("COMMIT");
        return res.json({ received: true, matched: false });
      }

      const amount = Number(session.amount_total) || 0;
      const paidInFull = amount >= Number(invoice.total_cents);

      // Notes for the user to see later if something needs a human
      let note = null;
      if (invoice.status !== "pending") {
        note = `Received while the invoice was already ${invoice.status}. Consider refunding it in Stripe.`;
      } else if (!paidInFull) {
        note =
          "Amount received is lower than the invoice total, so the invoice was not marked paid.";
      }

      await db.query(
        `INSERT INTO payments
         (invoice_id, user_id, stripe_account_id, stripe_checkout_session_id,
          stripe_payment_intent_id, amount_cents, application_fee_cents, currency, status, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'succeeded', $9)
       ON CONFLICT DO NOTHING`,
        [
          invoice.id,
          invoice.user_id,
          accountId,
          session.id,
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : null,
          amount,
          Number(session.metadata?.fee_cents) || 0,
          session.currency || "usd",
          note,
        ],
      );

      if (invoice.status === "pending" && paidInFull) {
        await db.query(
          `UPDATE invoices
         SET status = 'paid', paid_at = now(), paid_via = 'stripe', updated_at = now()
         WHERE id = $1 AND user_id = $2 AND status = 'pending'`,
          [invoice.id, invoice.user_id],
        );
      } else if (note) {
        console.warn(
          `Connect event ${event.id}, invoice ${invoice.id}: ${note}`,
        );
      }

      await db.query("COMMIT");
      return res.json({ received: true });
    } catch (error) {
      if (db) await db.query("ROLLBACK").catch(() => {});
      console.error(`Connect webhook failed for ${event.type}:`, error);
      return res.status(500).json({ error: "Webhook handling failed" });
    } finally {
      if (db) db.release();
    }
  },
);

module.exports = router;

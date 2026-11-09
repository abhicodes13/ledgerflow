const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const pool = require("./db");
const authenticateToken = require("./authMiddleware");

const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  process.env.FRONTEND_PRODUCTION_URL ||
  "http://localhost:5173";

// -------------------------------------------------------------------------
// Helpers: translate Stripe's subscription into our users columns
// -------------------------------------------------------------------------

// Stripe subscription status -> users.billing_status ('inactive' | 'active' | 'past_due')
function toBillingStatus(stripeStatus) {
  if (stripeStatus === "active" || stripeStatus === "trialing") return "active";
  if (stripeStatus === "past_due" || stripeStatus === "unpaid")
    return "past_due";
  return "inactive"; // canceled, incomplete, incomplete_expired, paused
}

// Which plan did they buy? Decided by the price ID, never by anything the browser sends.
function toTier(subscription) {
  const priceId = subscription.items?.data?.[0]?.price?.id;
  return priceId && priceId === process.env.STRIPE_PRICE_YEARLY
    ? "YEARLY"
    : "MONTHLY";
}

// Writes the subscription's current state onto the matching user.
// Returns true if a user row was updated.
async function applySubscription(db, subscription) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;

  const billingStatus = toBillingStatus(subscription.status);
  const tier = billingStatus === "inactive" ? "unpaid" : toTier(subscription);

  // Stripe moved current_period_end onto the subscription item in newer API versions
  const periodEndSeconds =
    subscription.current_period_end ??
    subscription.items?.data?.[0]?.current_period_end ??
    null;
  const periodEnd = periodEndSeconds ? new Date(periodEndSeconds * 1000) : null;

  // The last condition ignores a late "canceled" event for an OLD subscription
  // after the user has already started a new one.
  const result = await db.query(
    `UPDATE users
     SET subscription_tier = $1,
         billing_status = $2::text,
         stripe_subscription_id = $3,
         current_period_end = $4,
         updated_at = now()
     WHERE stripe_customer_id = $5
       AND (stripe_subscription_id IS NULL
            OR stripe_subscription_id = $3
            OR $2::text <> 'inactive')`,
    [tier, billingStatus, subscription.id, periodEnd, customerId],
  );
  return result.rowCount > 0;
}

// Events we act on, and where to find the subscription id in each
const HANDLED_EVENTS = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
]);

function getSubscriptionId(event) {
  const obj = event.data.object;
  switch (event.type) {
    case "checkout.session.completed":
      return obj.mode === "subscription" ? obj.subscription || null : null;
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      return obj.id;
    case "invoice.paid":
    case "invoice.payment_failed":
      // Older API versions: invoice.subscription. Newer: invoice.parent.subscription_details.subscription
      return (
        obj.subscription ||
        obj.parent?.subscription_details?.subscription ||
        null
      );
    default:
      return null;
  }
}

// -------------------------------------------------------------------------
// POST /api/payment/create-checkout-session
// Requires login. The user comes from the token, never from the request body.
// Body: { priceType: "monthly" | "yearly" }
// -------------------------------------------------------------------------
router.post(
  "/create-checkout-session",
  authenticateToken,
  express.json(),
  async (req, res) => {
    try {
      const userId = Number(req.user?.userId);
      const priceType = req.body?.priceType === "yearly" ? "yearly" : "monthly";
      const priceId =
        priceType === "yearly"
          ? process.env.STRIPE_PRICE_YEARLY
          : process.env.STRIPE_PRICE_MONTHLY;

      if (!priceId) {
        console.error("Stripe price IDs are not set in .env");
        return res
          .status(500)
          .json({ success: false, error: "Billing is not configured." });
      }

      const userResult = await pool.query(
        "SELECT id, email, billing_status, stripe_customer_id FROM users WHERE id = $1",
        [userId],
      );
      const user = userResult.rows[0];
      if (!user) {
        return res
          .status(401)
          .json({ success: false, error: "Account not found." });
      }

      if (user.billing_status === "active") {
        return res.status(409).json({
          success: false,
          error: "You already have an active subscription.",
        });
      }
      if (user.billing_status === "past_due") {
        return res.status(409).json({
          success: false,
          error:
            "Your last payment failed. Update your payment method in the billing portal.",
          code: "USE_BILLING_PORTAL",
        });
      }

      // One Stripe customer per user, created before checkout so the webhook
      // can always find the user by stripe_customer_id.
      let customerId = user.stripe_customer_id;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { userId: String(user.id) },
        });
        customerId = customer.id;
        await pool.query(
          "UPDATE users SET stripe_customer_id = $1, updated_at = now() WHERE id = $2",
          [customerId, user.id],
        );
      }

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        client_reference_id: String(user.id),
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${FRONTEND_URL}/dashboard?payment=success`,
        cancel_url: `${FRONTEND_URL}/dashboard?payment=cancelled`,
      });

      return res.json({ url: session.url });
    } catch (error) {
      console.error("Checkout session failed:", error);
      return res.status(500).json({
        success: false,
        error: "Could not start checkout. Please try again.",
      });
    }
  },
);

// -------------------------------------------------------------------------
// POST /api/payment/billing-portal
// Lets a customer update their card, switch plans, or cancel (Stripe-hosted).
// Needs the Customer Portal turned on in the Stripe dashboard.
// -------------------------------------------------------------------------
router.post("/billing-portal", authenticateToken, async (req, res) => {
  try {
    const userId = Number(req.user?.userId);
    const result = await pool.query(
      "SELECT stripe_customer_id FROM users WHERE id = $1",
      [userId],
    );
    const customerId = result.rows[0]?.stripe_customer_id;
    if (!customerId) {
      return res
        .status(400)
        .json({ success: false, error: "No billing account yet." });
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${FRONTEND_URL}/dashboard`,
    });
    return res.json({ url: portal.url });
  } catch (error) {
    console.error("Billing portal failed:", error);
    return res.status(500).json({
      success: false,
      error: "Could not open the billing portal.",
    });
  }
});

// -------------------------------------------------------------------------
// POST /api/payment/webhook
// Needs the RAW body (server.js mounts this router before express.json()).
// Every handled event re-reads the subscription from Stripe, so the result is
// correct even if events arrive late or out of order. Each event id is recorded
// in stripe_events in the same transaction, so a retry never applies twice.
// Failures return 500 so Stripe retries.
// -------------------------------------------------------------------------
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        req.headers["stripe-signature"],
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send("Webhook signature verification failed");
    }

    if (!HANDLED_EVENTS.has(event.type)) {
      return res.json({ received: true });
    }

    let db;
    try {
      const subscriptionId = getSubscriptionId(event);
      const subscription = subscriptionId
        ? await stripe.subscriptions.retrieve(subscriptionId)
        : null;

      db = await pool.connect();
      await db.query("BEGIN");

      // Already processed? (Stripe retries, or you resent the event)
      const inserted = await db.query(
        "INSERT INTO stripe_events (event_id) VALUES ($1) ON CONFLICT DO NOTHING RETURNING event_id",
        [event.id],
      );
      if (inserted.rowCount === 0) {
        await db.query("ROLLBACK");
        return res.json({ received: true, duplicate: true });
      }

      if (subscription) {
        const updated = await applySubscription(db, subscription);
        if (!updated) {
          // Unknown customer (for example a CLI test event). Acknowledge, don't retry forever.
          console.warn(
            `Stripe event ${event.type} (${event.id}) matched no user, ignoring.`,
          );
        }
      }

      await db.query("COMMIT");
      return res.json({ received: true });
    } catch (error) {
      if (db) await db.query("ROLLBACK").catch(() => {});
      console.error(`Stripe webhook failed for ${event.type}:`, error);
      return res.status(500).json({ error: "Webhook handling failed" });
    } finally {
      if (db) db.release();
    }
  },
);

module.exports = router;

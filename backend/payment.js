const express = require("express");
const router = express.Router();
// Dynamically initializes Stripe using environment keys
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const pool = require("./db");

// 🛒 ENDPOINT A: GENERATE SECURE CHECKOUT SESSIONS (MONTHLY VS YEARLY)
// NOTE: We added express.json() here exclusively so it reads the incoming frontend JSON fields!
router.post("/create-checkout-session", express.json(), async (req, res) => {
  const { userEmail, priceType } = req.body;

  // Stripe Price Lookup Matrix (Replace with your actual Stripe price IDs later)
  let stripePriceId = "";
  if (priceType === "yearly") {
    stripePriceId =
      process.env.STRIPE_PRICE_YEARLY || "price_1UO5I6CvaavjvpUwZTLgNEfJ";
  } else {
    stripePriceId =
      process.env.STRIPE_PRICE_MONTHLY || "price_1UO5H4CvaavjvpUwlW3DOrrf";
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: userEmail,
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      // Production fallback redirect links (We will swap localhost when we configure AWS S3/CloudFront)
      success_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/dashboard?session_id={CHECKOUT_SESSION_ID}&payment=success`,
      cancel_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/dashboard?payment=cancelled`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("❌ Stripe Checkout Session Exception:", error.message);
    res
      .status(500)
      .json({ error: "Failed to initialize payment gateway session tokens." });
  }
});

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      // Cryptographically verify that this message actually originated from Stripe
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      console.error(
        `❌ Webhook Authentication Verification Failure: ${err.message}`,
      );
      return res.status(400).send(`Webhook Security Error: ${err.message}`);
    }

    // Handle the event when a customer transaction finishes processing successfully!
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      // Safe fallback variables for mock simulation payloads
      const customerEmail =
        session.customer_details?.email || "test@example.com";
      const stripeCustomerId = session.customer || "cus_mock123";

      try {
        let planTierString = "MONTHLY";

        // 🛡️ MOCK TRIGGER FALLBACK GUARD
        // If Stripe CLI is firing a test trigger with no valid subscription field, bypass the network lookup
        if (session.subscription && session.subscription !== "null") {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription,
          );

          // Using explicit array data access index to read the active purchase item price token safely
          const purchasedPriceId = subscription.items.data[0].price.id;

          if (
            purchasedPriceId === process.env.STRIPE_PRICE_YEARLY ||
            purchasedPriceId === "price_1UO5I6CvaavjvpUwZTLgNEfJ"
          ) {
            planTierString = "YEARLY";
          }
        } else {
          console.log(
            "ℹ️ [STRIPE SIMULATION] Detected local test trigger payload. Defaulting to MONTHLY tier.",
          );
        }

        console.log(
          `💰 Secure Webhook Captured! Event verified for customer: ${customerEmail} | Tier: ${planTierString}`,
        );

        // Execute an atomic, parameterized query to activate user rows
        const updateQuery = `
          UPDATE users 
          SET subscription_tier = $1, 
              stripe_customer_id = $2, 
              billing_status = 'active' 
          WHERE username = $3;
        `;
        await pool.query(updateQuery, [
          planTierString,
          stripeCustomerId,
          customerEmail,
        ]);
        console.log(
          `🏆 SaaS Business Database Updated: Account state switched to ${planTierString} for ${customerEmail}`,
        );
      } catch (innerError) {
        console.error(
          `❌ Webhook business logic tracking failure: ${innerError.message}`,
        );
      }
    }

    res.json({ received: true });
  },
);

// 🛡️ ENDPOINT B: THE CRYPTOGRAPHIC WEBHOOK LISTENER
// Uses express.raw directly to preserve the untouched data stream required by Stripe
/*router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      // Cryptographically verify that this message actually originated from Stripe
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      console.error(
        `❌ Webhook Authentication Verification Failure: ${err.message}`,
      );
      return res.status(400).send(`Webhook Security Error: ${err.message}`);
    }

    // Handle the event when a customer transaction finishes processing successfully!
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const customerEmail = session.customer_details.email;
      const stripeCustomerId = session.customer;

      try {
        // Retrieve the subscription details to see exactly which price ID they bought
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription,
        );
        const purchasedPriceId = subscription.items.data[0].price.id;

        let planTierString = "MONTHLY";
        if (
          purchasedPriceId === process.env.STRIPE_PRICE_YEARLY ||
          purchasedPriceId === "price_1UO5I6CvaavjvpUwZTLgNEfJ"
        ) {
          planTierString = "YEARLY";
        }

        console.log(
          `💰 Secure Webhook Captured! Event verified for customer: ${customerEmail} | Tier: ${planTierString}`,
        );

        // Execute an atomic, parameterized query to activate user rows
        const updateQuery = `
          UPDATE users 
          SET subscription_tier = $1, 
              stripe_customer_id = $2, 
              billing_status = 'active' 
          WHERE username = $3;
        `;
        await pool.query(updateQuery, [
          planTierString,
          stripeCustomerId,
          customerEmail,
        ]);
        console.log(
          `🏆 SaaS Business Database Updated: Account state switched to ${planTierString} for ${customerEmail}`,
        );
      } catch (innerError) {
        console.error(
          `❌ Webhook business logic tracking failure: ${innerError.message}`,
        );
      }
    }

    res.json({ received: true });
  },
);*/

module.exports = router;

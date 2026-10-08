const express = require("express");
const router = express.Router();
// Dynamically initializes the Stripe library using secret keys kept in system environment memory [2.1]
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const pool = require("../db"); // Traverses up one folder level to grab your existing database pooling configurations [2.1]

// 🛒 ENDPOINT A: GENERATE SECURE CHECKOUT SESSIONS (MONTHLY VS YEARLY) [2.1]
router.post("/create-checkout-session", async (req, res) => {
  const { userEmail, priceType } = req.body; // Capture the logging tenant's email and chosen tier layout

  // 🧠 THE STRIPE PRICE LOOKUP MATRIX
  // Replace these placeholder strings with your actual API Price IDs from the Stripe Developer Dashboard later [2.1]
  let stripePriceId = "";
  if (priceType === "yearly") {
    stripePriceId = "price_1UO5I6CvaavjvpUwZTLgNEfJ"; // e.g., \$89.99/yr
  } else {
    stripePriceId = "price_1UO5H4CvaavjvpUwlW3DOrrf"; // e.g., \$9.99/mo (Default)
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: userEmail,
      line_items: [
        {
          price: stripePriceId, // Drops the explicit monthly or yearly price token directly into the transaction rails [2.1]
          quantity: 1,
        },
      ],
      mode: "subscription", // Configured as a rolling recurring SaaS subscription [2.1]
      // Redirect anchors telling the browser where to steer after checking out on the web [2.1]
      success_url: `http://localhost:5173/dashboard?session_id={CHECKOUT_SESSION_ID}&payment=success`,
      cancel_url: `http://localhost:5173/dashboard?payment=cancelled`,
    });

    // Return the secure checkout page link back to your React client interface [2.1]
    res.json({ url: session.url });
  } catch (error) {
    console.error("❌ Stripe Checkout Session Exception:", error.message);
    res
      .status(500)
      .json({ error: "Failed to initialize payment gateway session tokens." });
  }
});

// 🛡️ ENDPOINT B: THE CRYPTOGRAPHIC WEBHOOK LISTENER
// This route listens for secure, event-driven background signals fired directly from Stripe Cloud [2.1].
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      // Cryptographically verify that this message actually originated from Stripe, blocking hacker spoofs [2.1]
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

    // Handle the event when a customer transaction finishes processing successfully! [2.1]
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const customerEmail = session.customer_details.email;
      const stripeCustomerId = session.customer;

      // Retrieve the subscription details to see exactly which price ID they bought [2.1]
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription,
      );
      const purchasedPriceId = subscription.items.data.price.id;

      // Dynamically deduce the database string flag based on the incoming Price ID payload [2.1]
      let planTierString = "MONTHLY";
      if (purchasedPriceId === "price_YEARLY_PRICE_ID_FROM_STRIPE_DASHBOARD") {
        planTierString = "YEARLY";
      }

      console.log(
        `💰 Secure Webhook Captured! Event verified for customer: ${customerEmail} | Tier: ${planTierString}`,
      );

      // Acquire an open connection channel from your internal PostgreSQL connection pool [2.1]
      const dbClient = await pool.connect();
      try {
        // Execute an atomic, parameterized query to activate the user subscription row inside AWS RDS PostgreSQL [2.1]
        const updateQuery = `
        UPDATE users 
        SET subscription_tier = $1, 
            stripe_customer_id = $2, 
            billing_status = 'active' 
        WHERE username = $3;
      `;
        await dbClient.query(updateQuery, [
          planTierString,
          stripeCustomerId,
          customerEmail,
        ]);
        console.log(
          `🏆 SaaS Business Database Updated: Account state switched to ${planTierString} for ${customerEmail}`,
        );
      } catch (dbError) {
        console.error(
          `❌ Relational Database Update Exception: ${dbError.message}`,
        );
      } finally {
        dbClient.release(); // Immediately release the connection handle back to the pool to prevent starvation crashes [2.1]
      }
    }

    res.json({ received: true });
  },
);

module.exports = router;

const pool = require("./db");

async function checkSubscription(req, res, next) {
  // Extract userId safely from the req.user payload injected by your JWT authMiddleware
  const activeUserId = req.user.userId;

  try {
    // Check our database record for this user's active billing status
    const result = await pool.query(
      "SELECT billing_status, subscription_tier FROM users WHERE id = $1",
      [activeUserId],
    );

    const user = result.rows[0];

    if (!user) {
      return res
        .status(404)
        .json({ error: "User identity record not located." });
    }

    // Allow entry if billing_status is 'active' or if you want to support a 'trialing' stage
    if (
      user.billing_status === "active" ||
      user.billing_status === "trialing"
    ) {
      return next(); // 🔓 Access validated! Move along to your service handlers.
    }

    // 🔒 Halt request if payment is inactive or overdue
    return res.status(403).json({
      error: "Subscription Required",
      message:
        "Your current billing profile is inactive or past due. Please reactivate access via the billing gateway.",
    });
  } catch (error) {
    console.error("🚨 [BILLING GATE FAILURE]:", error);
    return res
      .status(500)
      .json({ error: "Internal validation subsystem error." });
  }
}

module.exports = checkSubscription;

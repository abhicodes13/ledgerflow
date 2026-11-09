const pool = require("./db");

// Must run AFTER authenticateToken (it needs req.user).
// Billing status is read from the database on every request, never from the
// JWT, so a cancelled or failed payment takes effect immediately.
async function checkSubscription(req, res, next) {
  try {
    const userId = Number(req.user?.userId);
    if (!Number.isInteger(userId) || userId < 1) {
      return res.status(401).json({
        success: false,
        error: "Authentication required.",
        code: "TOKEN_INVALID",
      });
    }

    const result = await pool.query(
      "SELECT billing_status, subscription_tier, current_period_end FROM users WHERE id = $1",
      [userId],
    );
    const user = result.rows[0];

    // A valid token for a deleted account
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Account not found.",
        code: "ACCOUNT_NOT_FOUND",
      });
    }

    if (user.billing_status === "active") {
      req.billing = user; // available to route handlers if they need it
      return next();
    }

    return res.status(403).json({
      success: false,
      error: "An active subscription is required to use this feature.",
      code: "SUBSCRIPTION_REQUIRED",
      billing_status: user.billing_status,
    });
  } catch (error) {
    console.error("Subscription check failed:", error);
    return res
      .status(500)
      .json({ success: false, error: "Something went wrong" });
  }
}

module.exports = checkSubscription;

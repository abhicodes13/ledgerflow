const express = require("express");
const rateLimit = require("express-rate-limit");
const connectService = require("./connectService");
const { AppError } = require("./errors");

// Mounted in server.js behind authenticateToken and checkSubscription:
//   app.use("/api/connect", authenticateToken, checkSubscription, connectRouter);
const router = express.Router();

function userIdOf(req) {
  const id = Number(req.user?.userId ?? req.user?.id);
  if (!Number.isInteger(id) || id < 1)
    throw new AppError("Invalid session", 401);
  return id;
}

function fail(res, error, label) {
  if (error instanceof AppError) {
    return res
      .status(error.status)
      .json({ success: false, error: error.message, code: error.code });
  }
  console.error(`${label}:`, error);
  return res
    .status(500)
    .json({ success: false, error: "Something went wrong" });
}

// Where is this user in the Stripe setup?
// -> { success, state, charges_enabled, card_payments_status, requirements_due }
//    state: "not_connected" | "onboarding_incomplete" | "restricted" | "active"
router.get("/status", async (req, res) => {
  try {
    const status = await connectService.getStatus(userIdOf(req));
    return res.json({ success: true, ...status });
  } catch (error) {
    return fail(res, error, "connect status failed");
  }
});

// Creates the Stripe account if needed and returns a one-time onboarding URL.
// The frontend sends the browser there (window.location = url).
router.post(
  "/onboarding-link",
  rateLimit({ windowMs: 60 * 60 * 1000, max: 20 }),
  async (req, res) => {
    try {
      const url = await connectService.createOnboardingLink(userIdOf(req));
      return res.json({ success: true, url });
    } catch (error) {
      return fail(res, error, "connect onboarding link failed");
    }
  },
);

module.exports = router;

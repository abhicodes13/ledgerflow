const express = require("express");
const rateLimit = require("express-rate-limit");
const paymentLinks = require("./paymentLinks");

// Public: no login, because the client who opens the link is not a user.
// The long random token in the URL is the only key, and it only ever leads to
// Stripe's payment page or a friendly result page.
// Mounted in server.js:  app.use("/pay", payRouter);
const router = express.Router();

router.get(
  "/:token",
  rateLimit({ windowMs: 60 * 1000, max: 30 }),
  async (req, res) => {
    try {
      const url = await paymentLinks.startCheckout(req.params.token);
      return res.redirect(302, url);
    } catch (error) {
      // Never show an error page to a client who is trying to pay
      console.error("pay link failed:", error.message);
      return res.redirect(302, paymentLinks.resultUrl("unavailable"));
    }
  },
);

module.exports = router;

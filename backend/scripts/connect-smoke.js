// Run from the backend folder (put this file in backend/scripts/):
//
//   node scripts/connect-smoke.js USER_ID
//
// It uses your real .env, so with a sandbox STRIPE_SECRET_KEY (sk_test_...) it
// creates a connected account in your Stripe SANDBOX for that user, prints its
// status, and prints a link to open in your browser to finish onboarding with
// Stripe's test data. Run it again afterwards: the status should be "active".
require("dotenv").config();

const key = process.env.STRIPE_SECRET_KEY || "";
if (!key.startsWith("sk_test_")) {
  console.error(
    "Refusing to run: STRIPE_SECRET_KEY is not a sandbox key (sk_test_...). " +
      "Use your local .env with the sandbox key for this test.",
  );
  process.exit(1);
}

const connectService = require("../connectService");
const pool = require("../db");

(async () => {
  const userId = Number(process.argv[2]);
  if (!Number.isInteger(userId) || userId < 1) {
    console.error("Usage: node scripts/connect-smoke.js USER_ID");
    process.exit(1);
  }

  const before = await connectService.getStatus(userId);
  console.log("Status:", before);

  if (before.state !== "active") {
    const url = await connectService.createOnboardingLink(userId);
    console.log(
      "\nOpen this link in your browser and finish the Stripe form with test data:\n",
    );
    console.log(url);
    console.log(
      '\nThen run this script again. The state should become "active".',
    );
  } else {
    console.log("\nThis account can already take payments.");
  }
})()
  .catch((error) => {
    console.error("\nFAILED:", error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());

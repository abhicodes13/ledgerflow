const { sendEmail } = require("./emailService");

const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

async function sendResetEmail({ to, username, token }) {
  const base = process.env.FRONTEND_PRODUCTION_URL || "http://localhost:5173";
  const link = `${base}/reset-password?token=${token}`;

  // Dev only: lets you test without opening the email. Never log this in production.
  if (process.env.NODE_ENV !== "production") console.log("RESET LINK:", link);

  await sendEmail({
    to,
    subject: "Reset your LedgerFlow password",
    text: `Your username is ${username}.\n\nReset your password (link expires in 30 minutes):\n${link}\n\nIf you didn't request this, you can ignore this email.`,
    html: `<p>Your username is <strong>${esc(username)}</strong>.</p>
           <p><a href="${link}">Reset your password</a> (link expires in 30 minutes).</p>
           <p>If you didn't request this, you can ignore this email.</p>`,
  });
}

module.exports = { sendResetEmail };

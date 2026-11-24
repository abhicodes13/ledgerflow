const { Resend } = require("resend");

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Sends one email through Resend. Throws if it can't be sent.
//
// Safety switch for development: if EMAIL_REDIRECT_TO is set in .env, EVERY
// email goes to that address instead of the real recipient, so testing can
// never email a real client.
async function sendEmail({ to, subject, html, text, replyTo }) {
  if (!resend) throw new Error("RESEND_API_KEY is not set");
  const from = process.env.EMAIL_FROM;
  if (!from) throw new Error("EMAIL_FROM is not set");

  const deliveredTo = process.env.EMAIL_REDIRECT_TO || to;
  const finalSubject = process.env.EMAIL_REDIRECT_TO
    ? `[TEST, intended for ${to}] ${subject}`
    : subject;

  const { data, error } = await resend.emails.send({
    from,
    to: deliveredTo,
    subject: finalSubject,
    html,
    text,
    replyTo, // clients who hit Reply write to the invoice owner
  });
  if (error) {
    throw new Error(error.message || "Email provider rejected the message");
  }
  return { id: data?.id || null, deliveredTo };
}

module.exports = { sendEmail };

import { errorMessage } from "./api";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

// Only https links reach the clipboard. Plain http is allowed for localhost, for local testing.
export function safeLink(value) {
  try {
    const u = new URL(String(value));
    if (u.protocol === "https:") return u.toString();
    if (u.protocol === "http:" && LOCAL_HOSTS.has(u.hostname))
      return u.toString();
    return null;
  } catch {
    return null;
  }
}

export async function fetchPaymentLink(apiBase, token, invoiceId) {
  const res = await fetch(
    `${apiBase}/api/connect/invoices/${encodeURIComponent(invoiceId)}/payment-link`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const body = await res.json().catch(() => null);
  if (!res.ok)
    throw new Error(errorMessage(body, "Couldn't get the payment link."));
  const url = body?.enabled ? safeLink(body.url) : null;
  return {
    url,
    reason: body?.enabled && !url ? "invalid_link" : (body?.reason ?? null),
  };
}

export function paymentLinkMessage(reason) {
  if (reason === "payments_not_set_up")
    return "Connect Stripe in Settings → Payments to share payment links.";
  if (reason === "invalid_link")
    return "The payment link has an unexpected format, so it can't be copied.";
  return "Online payment isn't available for this invoice.";
}

// Fetches and copies a payment link in one click.
// Safari only allows a clipboard write inside the click that started it, so where the
// browser supports it we hand the clipboard the link as a promise instead of waiting.
// Returns { ok: true } | { ok: false, reason } | { ok: false, error }.
export async function copyPaymentLink(apiBase, token, invoiceId) {
  let result = null;
  const linkPromise = fetchPaymentLink(apiBase, token, invoiceId).then((r) => {
    result = r;
    return r;
  });

  try {
    if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
      const blob = linkPromise.then((r) => {
        if (!r.url) throw new Error("no link");
        return new Blob([r.url], { type: "text/plain" });
      });
      await navigator.clipboard.write([
        new ClipboardItem({ "text/plain": blob }),
      ]);
      return { ok: true };
    }
    const r = await linkPromise;
    if (!r.url) return { ok: false, reason: r.reason };
    await navigator.clipboard.writeText(r.url);
    return { ok: true };
  } catch {
    try {
      await linkPromise; // surfaces the request's own error, if that's what failed
    } catch (err) {
      return { ok: false, error: err.message };
    }
    if (result && !result.url) return { ok: false, reason: result.reason };
    return { ok: false, error: "Couldn't copy to the clipboard." };
  }
}

// Remembers the payment terms you last used for each client, in this browser only.
const PRESET_DAYS = [0, 15, 30, 45];
const keyOf = (user, clientId) => `lf_terms:${user || "me"}:${clientId}`;

export function getTerms(user, clientId) {
  try {
    const raw = localStorage.getItem(keyOf(user, clientId));
    if (raw === null) return null;
    const days = Number(raw);
    return PRESET_DAYS.includes(days) ? days : null;
  } catch {
    return null;
  }
}

// Only the preset terms are remembered. A one-off custom date changes nothing.
export function rememberTerms(user, clientId, days) {
  if (!clientId || !PRESET_DAYS.includes(days)) return;
  try {
    localStorage.setItem(keyOf(user, clientId), String(days));
  } catch {
    /* private mode: it simply won't be remembered */
  }
}

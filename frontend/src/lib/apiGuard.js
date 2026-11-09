// Watches responses from our API and announces auth/billing failures,
// so the UI can react in one place instead of in every fetch call.
export const API_ERROR_EVENT = "lf:api-error";
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function installApiGuard() {
  if (window.__lfApiGuard) return;
  window.__lfApiGuard = true;

  const original = window.fetch.bind(window);
  const lastSeen = {};

  window.fetch = async (input, init) => {
    const res = await original(input, init);

    if (res.status === 401 || res.status === 403) {
      const url = String(input?.url ?? input);
      // Wrong password on the login screen is not a "session ended" event
      if (url.startsWith(API_BASE) && !url.includes("/api/auth/")) {
        res
          .clone()
          .json()
          .catch(() => ({}))
          .then((body) => {
            const code =
              body?.code ?? (res.status === 401 ? "UNAUTHORIZED" : "FORBIDDEN");
            // Many requests fail together on page load: announce once
            const now = Date.now();
            if (now - (lastSeen[code] ?? 0) < 2000) return;
            lastSeen[code] = now;
            window.dispatchEvent(
              new CustomEvent(API_ERROR_EVENT, {
                detail: {
                  status: res.status,
                  code,
                  billingStatus: body?.billing_status ?? null,
                },
              }),
            );
          });
      }
    }
    return res;
  };
}

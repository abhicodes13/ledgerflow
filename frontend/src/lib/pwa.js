// Install prompt + service worker. The browser fires "beforeinstallprompt" early,
// so it's captured here once and read later by the Settings card.
let state = { prompt: null, installed: false };
const listeners = new Set();

function set(next) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

export const subscribeInstall = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
export const getInstallState = () => state;

export function setupPwa() {
  if (typeof window === "undefined") return;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // we show our own button instead of the browser's banner
    set({ prompt: e });
  });
  window.addEventListener("appinstalled", () =>
    set({ prompt: null, installed: true }),
  );

  // Production only, so local development never serves anything stale
  if (import.meta.env.PROD && "serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
  }
}

// Returns "accepted" | "dismissed" | null
export async function promptInstall() {
  const event = state.prompt;
  if (!event) return null;
  event.prompt();
  const { outcome } = await event.userChoice;
  set({ prompt: null }); // the browser allows one use per event
  return outcome;
}

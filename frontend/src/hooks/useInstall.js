import { useSyncExternalStore } from "react";
import { getInstallState, subscribeInstall } from "../lib/pwa";

const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)").matches ||
    window.navigator.standalone === true);

const isIos = () =>
  typeof navigator !== "undefined" &&
  (/iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

export function useInstall() {
  const state = useSyncExternalStore(subscribeInstall, getInstallState);
  return {
    canInstall: !!state.prompt,
    installed: state.installed || isStandalone(),
    ios: isIos(),
  };
}

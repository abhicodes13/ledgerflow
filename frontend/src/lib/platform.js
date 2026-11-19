// Shows ⌘K on a Mac and Ctrl K elsewhere
export const isMac =
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent);
export const shortcutLabel = isMac ? "⌘K" : "Ctrl K";

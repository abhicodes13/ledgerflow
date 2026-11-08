// One place that maps tab ids (used by App, AppShell, AIConsole) to URLs.
export const TAB_PATHS = {
  dashboard: "/app",
  billing: "/app/invoices",
  customers: "/app/clients",
  automations: "/app/automations",
  settings: "/app/settings",
};

export const tabToPath = (id) => TAB_PATHS[id] ?? TAB_PATHS.dashboard;

// Returns a tab id, or null if the path isn't one of ours.
export function pathToTab(pathname) {
  const clean = pathname.replace(/\/+$/, "") || "/";
  const hit = Object.entries(TAB_PATHS).find(([, path]) => path === clean);
  return hit ? hit[0] : null;
}

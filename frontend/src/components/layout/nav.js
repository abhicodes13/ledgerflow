import { LayoutDashboard, FileText, Users, Zap, Settings } from "lucide-react";

// Tab ids match the ones App.jsx and AIConsole already use.
export const NAV = [
  { id: "dashboard", label: "Overview", icon: LayoutDashboard },
  { id: "billing", label: "Invoices", icon: FileText },
  { id: "customers", label: "Clients", icon: Users },
  { id: "automations", label: "Automations", icon: Zap },
  { id: "settings", label: "Settings", icon: Settings },
];

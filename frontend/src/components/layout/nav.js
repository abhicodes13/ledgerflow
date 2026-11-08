import { LayoutDashboard, FileText, Users, Zap, Settings } from "lucide-react";
import { TAB_PATHS } from "../../lib/routes";

export const NAV = [
  {
    id: "dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    to: TAB_PATHS.dashboard,
    end: true,
  },
  { id: "billing", label: "Invoices", icon: FileText, to: TAB_PATHS.billing },
  { id: "customers", label: "Clients", icon: Users, to: TAB_PATHS.customers },
  {
    id: "automations",
    label: "Automations",
    icon: Zap,
    to: TAB_PATHS.automations,
  },
  { id: "settings", label: "Settings", icon: Settings, to: TAB_PATHS.settings },
];

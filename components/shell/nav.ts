import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FolderKanban,
  TrendingUp,
  Building2,
  SlidersHorizontal,
  Calculator,
  FileText,
  ClipboardCheck,
  ShoppingCart,
  Factory,
  FlaskConical,
  Files,
  Sparkles,
  Settings,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  soon?: boolean; // module arriving in a later build phase
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV: NavSection[] = [
  {
    title: "Workspace",
    items: [
      { label: "Overview", href: "/", icon: LayoutDashboard },
      { label: "Projects", href: "/projects", icon: FolderKanban },
    ],
  },
  {
    title: "Sales",
    items: [
      { label: "Pipeline", href: "/pipeline", icon: TrendingUp },
      { label: "Customers", href: "/customers", icon: Building2 },
    ],
  },
  {
    title: "Engineering",
    items: [
      { label: "Configurator", href: "/configurator", icon: SlidersHorizontal },
      { label: "Estimation", href: "/estimation", icon: Calculator },
      { label: "Quotations", href: "/quotations", icon: FileText },
      { label: "Compliance", href: "/compliance", icon: ClipboardCheck },
    ],
  },
  {
    title: "Operations",
    items: [
      { label: "Procurement", href: "/procurement", icon: ShoppingCart },
      { label: "Manufacturing", href: "/manufacturing", icon: Factory },
      { label: "Testing & QA", href: "/testing", icon: FlaskConical },
    ],
  },
  {
    title: "Platform",
    items: [
      { label: "Documents", href: "/documents", icon: Files },
      { label: "AI Assistant", href: "/assistant", icon: Sparkles },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

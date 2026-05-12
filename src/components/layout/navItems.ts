import {
  LayoutGrid,
  PlusCircle,
  Receipt,
  Users,
  ChartPie,
  CreditCard,
  FileText,
  Tags,
  Bell,
  Settings,
} from "lucide-react";

export const navItems = [
  { to: "/app/dashboard", label: "Dashboard", Icon: LayoutGrid },
  { to: "/app/expenses/new", label: "Add", Icon: PlusCircle },
  { to: "/app/expenses", label: "History", Icon: Receipt },
  { to: "/app/shared", label: "Shared", Icon: Users },
  { to: "/app/analytics", label: "Analytics", Icon: ChartPie },
  { to: "/app/cards", label: "Payments", Icon: CreditCard },
  { to: "/app/reports", label: "Reports", Icon: FileText },
  { to: "/app/categories", label: "Categories", Icon: Tags },
  { to: "/app/notifications", label: "Alerts", Icon: Bell },
  { to: "/app/settings", label: "Settings", Icon: Settings },
];



import { NavLink } from "react-router-dom";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems } from "./navItems";

const bottomItems = navItems.filter((item) =>
  [
    "/app/dashboard",
    "/app/expenses",
    "/app/shared",
    "/app/cards",
  ].includes(item.to),
);

export default function BottomNav() {
  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-app-border/60 bg-[rgba(var(--bg),0.85)] px-2 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2 backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-4 gap-1">
          {bottomItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-1 rounded-2xl py-2 text-[11px] font-medium transition",
                  isActive ? "bg-app-surface text-[rgb(var(--accent))]" : "text-app-muted hover:text-app-foreground",
                )
              }
            >
              <Icon className="h-5 w-5" />
              <span className="leading-none mt-0.5">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Floating Action Button for Add Expense */}
      <NavLink
        to="/app/expenses/new"
        className={({ isActive }) =>
          cn(
            "fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+84px)] z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.4)] transition-transform hover:scale-105 active:scale-95 md:hidden",
            isActive
              ? "bg-[rgb(var(--accent))] text-[rgb(var(--accent-foreground))] scale-95"
              : "bg-[rgb(var(--accent))] text-[rgb(var(--accent-foreground))]"
          )
        }
      >
        <Plus className="h-6 w-6" />
      </NavLink>
    </>
  );
}


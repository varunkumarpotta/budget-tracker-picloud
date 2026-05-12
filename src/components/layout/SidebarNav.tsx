import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { navItems } from "./navItems";

export default function SidebarNav() {
  return (
    <aside className="hidden w-72 shrink-0 md:block">
      <div className="sticky top-0 flex h-dvh flex-col p-4">
        <div className="rounded-3xl border border-app-border/60 bg-app-surface/60 p-4 shadow-[0_24px_64px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-semibold tracking-tight text-app-foreground">
                Ledgerly
              </div>
              <div className="text-xs text-app-muted">Premium expense intelligence</div>
            </div>
            <div className="h-9 w-9 rounded-2xl bg-[radial-gradient(circle_at_30%_30%,rgba(var(--accent),0.9),rgba(var(--accent),0.25))]" />
          </div>

          <div className="mt-4 grid gap-1">
            {navItems.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition",
                    isActive
                      ? "bg-app-surface text-app-foreground"
                      : "text-app-muted hover:bg-app-surface/70 hover:text-app-foreground",
                  )
                }
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}


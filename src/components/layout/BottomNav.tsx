import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { navItems } from "./navItems";

const bottomItems = navItems.filter((item) =>
  [
    "/app/dashboard",
    "/app/expenses/new",
    "/app/expenses",
    "/app/shared",
    "/app/cards",
  ].includes(item.to),
);

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-app-border/60 bg-app-surface/60 px-2 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2 backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
        {bottomItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-1 rounded-2xl py-2 text-[11px] font-medium transition",
                isActive ? "bg-app-surface text-app-foreground" : "text-app-muted",
              )
            }
          >
            <Icon className="h-5 w-5" />
            <span className="leading-none">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}


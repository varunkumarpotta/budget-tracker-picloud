import { useMemo, useState } from "react";
import { useLocation, Link, NavLink } from "react-router-dom";
import { ChevronLeft, Search, Sparkles, Menu, X } from "lucide-react";
import { navItems } from "./navItems";
import { cn } from "@/lib/utils";

export default function TopBar() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const title = useMemo(() => {
    const found = navItems.find((item) => location.pathname.startsWith(item.to));
    if (found) return found.label;
    if (location.pathname.startsWith("/app/expenses/new")) return "Add Expense";
    return "Ledgerly";
  }, [location.pathname]);

  const backTarget =
    location.pathname === "/app/dashboard" ? null : "/app/dashboard";

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-app-border/50 bg-[rgba(var(--bg),0.66)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          {backTarget ? (
            <Link
              to={backTarget}
              className={cn(
                "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-app-border/60 bg-app-surface/40 text-app-foreground transition hover:bg-app-surface/70",
              )}
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
          ) : (
            <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_30%_30%,rgba(var(--accent),0.85),rgba(var(--accent),0.18))]">
              <Sparkles className="h-5 w-5 text-[rgb(var(--accent-foreground))]" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-lg tracking-tight text-app-foreground">
              {title}
            </div>
            <div className="truncate text-xs text-app-muted">Tap to add, swipe to review, settle monthly</div>
          </div>

          <button className="hidden md:inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-app-border/60 bg-app-surface/40 text-app-foreground transition hover:bg-app-surface/70">
            <Search className="h-5 w-5" />
          </button>
          
          <button 
            onClick={() => setMenuOpen(true)}
            className="md:hidden inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-app-border/60 bg-app-surface/40 text-app-foreground transition hover:bg-app-surface/70"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-app text-app-foreground md:hidden">
          <div className="flex items-center justify-between border-b border-app-border/50 px-4 py-3 bg-[rgba(var(--bg),0.9)] backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_30%_30%,rgba(var(--accent),0.85),rgba(var(--accent),0.18))]">
                <Sparkles className="h-5 w-5 text-[rgb(var(--accent-foreground))]" />
              </div>
              <div>
                <div className="font-display text-lg tracking-tight text-app-foreground">Navigation</div>
                <div className="text-xs text-app-muted">All modules & settings</div>
              </div>
            </div>
            <button 
              onClick={() => setMenuOpen(false)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-app-border/60 bg-app-surface/40 text-app-foreground transition hover:bg-app-surface/70"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 pb-20">
            <div className="grid gap-2">
              {navItems.map(({ to, label, Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-medium transition",
                      isActive
                        ? "bg-[rgb(var(--accent))] text-[rgb(var(--accent-foreground))]"
                        : "bg-app-surface/60 text-app-foreground hover:bg-app-surface/80",
                    )
                  }
                >
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}


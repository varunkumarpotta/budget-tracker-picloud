import { useMemo } from "react";
import { useLocation, Link } from "react-router-dom";
import { ChevronLeft, Search, Sparkles } from "lucide-react";
import { navItems } from "./navItems";
import { cn } from "@/lib/utils";

export default function TopBar() {
  const location = useLocation();

  const title = useMemo(() => {
    const found = navItems.find((item) => location.pathname.startsWith(item.to));
    if (found) return found.label;
    if (location.pathname.startsWith("/app/expenses/new")) return "Add Expense";
    return "Ledgerly";
  }, [location.pathname]);

  const backTarget =
    location.pathname === "/app/dashboard" ? null : "/app/dashboard";

  return (
    <header className="sticky top-0 z-30 border-b border-app-border/50 bg-[rgba(var(--bg),0.66)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        {backTarget ? (
          <Link
            to={backTarget}
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-app-border/60 bg-app-surface/40 text-app-foreground transition hover:bg-app-surface/70",
            )}
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
        ) : (
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_30%_30%,rgba(var(--accent),0.85),rgba(var(--accent),0.18))]">
            <Sparkles className="h-5 w-5 text-[rgb(var(--accent-foreground))]" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-lg tracking-tight text-app-foreground">
            {title}
          </div>
          <div className="text-xs text-app-muted">Tap to add, swipe to review, settle monthly</div>
        </div>

        <button className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-app-border/60 bg-app-surface/40 text-app-foreground transition hover:bg-app-surface/70">
          <Search className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}


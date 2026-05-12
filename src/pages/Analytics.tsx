import { useEffect, useMemo } from "react";
import Card from "@/components/ui/Card";
import { monthKey } from "@/lib/date";
import { fromMinor } from "@/lib/money";
import { refreshExpensesForMonth, useExpenseStore } from "@/stores/expenseStore";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

export default function Analytics() {
  const hydrate = useExpenseStore((s) => s.hydrate);
  const listForMonth = useExpenseStore((s) => s.listForMonth);
  const month = useMemo(() => monthKey(new Date()), []);

  useEffect(() => {
    hydrate();
    void refreshExpensesForMonth(month);
  }, [hydrate, month]);

  const expenses = listForMonth(month);

  const stats = useMemo(() => {
    let totalPaid = 0;
    let yourShareTotal = 0;
    let receivableTotal = 0;
    let incomeTotal = 0;

    const categoryMap: Record<string, number> = {};

    expenses.forEach((e) => {
      const amount = fromMinor(e.amountMinor);
      
      if (e.kind === "INCOME") {
        incomeTotal += amount;
        return; // Don't count income in expenses
      }
      
      totalPaid += amount;
      
      const share = e.myShareMinor !== null && e.myShareMinor !== undefined 
        ? fromMinor(e.myShareMinor) 
        : amount;
      
      yourShareTotal += share;
      
      if (e.kind === "SHARED" && amount > share) {
        receivableTotal += (amount - share);
      }

      const cat = e.categoryName || "Uncategorized";
      categoryMap[cat] = (categoryMap[cat] || 0) + share;
    });

    const categories = Object.entries(categoryMap)
      .map(([name, amount]) => ({
        name,
        amount,
        pct: yourShareTotal > 0 ? (amount / yourShareTotal) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    return { totalPaid, yourShareTotal, receivableTotal, incomeTotal, categories };
  }, [expenses]);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <Card className="p-4">
          <div className="text-sm font-semibold">Category distribution</div>
          <div className="mt-1 text-xs text-app-muted">
            Your spending this month broken down by category.
          </div>

          <div className="mt-4 space-y-3">
            {stats.categories.length === 0 ? (
              <div className="text-sm text-app-muted py-4">No spending data this month.</div>
            ) : (
              stats.categories.map((c) => (
                <div key={c.name}>
                  <div className="flex items-center justify-between text-xs">
                    <div className="font-semibold text-app-foreground">{c.name}</div>
                    <div className="text-app-muted">{inr.format(c.amount)}</div>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-app-surface/50">
                    <div
                      className="h-2 rounded-full bg-[rgb(var(--accent))]"
                      style={{ width: `${c.pct}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm font-semibold">Financial summary</div>
          <div className="mt-1 text-xs text-app-muted">
            Separate “paid” from “actual share” for accurate budgeting.
          </div>

          <div className="mt-5 grid gap-3">
            {stats.incomeTotal > 0 && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <div className="text-xs text-emerald-600/80 dark:text-emerald-400/80">Total Income</div>
                <div className="mt-1 text-lg font-semibold text-emerald-600 dark:text-emerald-400">+{inr.format(stats.incomeTotal)}</div>
              </div>
            )}
            <div className="rounded-2xl border border-app-border/60 bg-app-surface/40 p-4">
              <div className="text-xs text-app-muted">Total Paid Out</div>
              <div className="mt-1 text-lg font-semibold">{inr.format(stats.totalPaid)}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-app-border/60 bg-app-surface/40 p-4">
                <div className="text-xs text-app-muted">Your actual share</div>
                <div className="mt-1 text-lg font-semibold">{inr.format(stats.yourShareTotal)}</div>
              </div>
              <div className="rounded-2xl border border-app-border/60 bg-app-surface/40 p-4">
                <div className="text-xs text-app-muted">Receivable</div>
                <div className="mt-1 text-lg font-semibold text-emerald-400">
                  {inr.format(stats.receivableTotal)}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="text-sm font-semibold">Heatmap</div>
        <div className="mt-1 text-xs text-app-muted">
          Calendar heatmap view for daily spend intensity (coming soon).
        </div>
        <div className="mt-4 grid grid-cols-7 gap-2">
          {Array.from({ length: 28 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-lg border border-app-border/60 bg-app-surface/40"
              style={{
                opacity: 0.35 + ((i * 13) % 55) / 100,
              }}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}



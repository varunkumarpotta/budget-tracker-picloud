import { ArrowUpRight, CreditCard, Sparkles, TrendingUp, Users } from "lucide-react";
import { useEffect, useMemo } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { monthKey } from "@/lib/date";
import { fromMinor } from "@/lib/money";
import { refreshExpensesForMonth, useExpenseStore } from "@/stores/expenseStore";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

export default function Dashboard() {
  const hydrate = useExpenseStore((s) => s.hydrate);
  const listForMonth = useExpenseStore((s) => s.listForMonth);
  const month = useMemo(() => monthKey(new Date()), []);

  useEffect(() => {
    hydrate();
    void refreshExpensesForMonth(month);
  }, [hydrate, month]);

  const stats = useMemo(() => {
    const items = listForMonth(month);
    let totalPaidMinor = 0;
    let personalMinor = 0;
    let sharedPaidMinor = 0;
    let myShareMinor = 0;
    let receivableMinor = 0;

    for (const e of items) {
      totalPaidMinor += e.amountMinor;
      if (e.kind === "PERSONAL") {
        personalMinor += e.amountMinor;
        myShareMinor += e.amountMinor;
      } else {
        sharedPaidMinor += e.amountMinor;
        const share = e.myShareMinor ?? e.amountMinor;
        myShareMinor += share;
        receivableMinor += Math.max(e.amountMinor - share, 0);
      }
    }

    return {
      totalPaid: fromMinor(totalPaidMinor),
      personal: fromMinor(personalMinor),
      sharedPaid: fromMinor(sharedPaidMinor),
      myShare: fromMinor(myShareMinor),
      receivable: fromMinor(receivableMinor),
      count: items.length,
    };
  }, [listForMonth, month]);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-app-muted">Total spending</div>
            <TrendingUp className="h-4 w-4 text-app-muted" />
          </div>
          <div className="mt-2 font-display text-3xl tracking-tight">
            {inr.format(stats.totalPaid)}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-app-muted">
            {stats.count === 0 ? "No expenses yet" : `${stats.count} entries this month`}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-app-muted">Your share</div>
            <Sparkles className="h-4 w-4 text-app-muted" />
          </div>
          <div className="mt-2 text-2xl font-semibold">{inr.format(stats.myShare)}</div>
          <div className="mt-2 text-xs text-app-muted">
            Paid {inr.format(stats.totalPaid)} · Receivable{" "}
            <span className="text-emerald-400">{inr.format(stats.receivable)}</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-app-muted">Card dues</div>
            <CreditCard className="h-4 w-4 text-app-muted" />
          </div>
          <div className="mt-2 text-2xl font-semibold">{inr.format(0)}</div>
          <div className="mt-2 text-xs text-app-muted">Statement workflow next</div>
        </Card>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Quick insights</div>
              <div className="mt-1 text-xs text-app-muted">
                Generated from your recent spending patterns
              </div>
            </div>
            <Button variant="secondary" size="sm">
              View
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-4 grid gap-2">
            <div className="rounded-2xl border border-app-border/60 bg-app-surface/40 p-3 text-sm">
              Personal: {inr.format(stats.personal)} · Shared paid: {inr.format(stats.sharedPaid)}
            </div>
            <div className="rounded-2xl border border-app-border/60 bg-app-surface/40 p-3 text-sm">
              Your share: {inr.format(stats.myShare)} · Receivable: {inr.format(stats.receivable)}
            </div>
            <div className="rounded-2xl border border-app-border/60 bg-app-surface/40 p-3 text-sm">
              Add more entries to unlock trend and anomaly insights.
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Shared snapshot</div>
              <div className="mt-1 text-xs text-app-muted">Net balances across groups</div>
            </div>
            <Users className="h-5 w-5 text-app-muted" />
          </div>

          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-app-border/60 bg-app-surface/40 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">Family</div>
                  <div className="mt-1 text-xs text-app-muted">This month</div>
                </div>
                <div className="text-sm font-semibold text-emerald-400">
                  +{inr.format(stats.receivable)}
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-app-border/60 bg-app-surface/40 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">Friends</div>
                  <div className="mt-1 text-xs text-app-muted">Rolling</div>
                </div>
                <div className="text-sm font-semibold text-red-400">
                  -{inr.format(0)}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

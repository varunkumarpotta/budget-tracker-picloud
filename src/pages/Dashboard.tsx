import { ArrowUpRight, CreditCard, Sparkles, TrendingUp, Users, User, Share2, PieChart } from "lucide-react";
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
    let familyReceivable = 0;
    let friendsReceivable = 0;

    for (const e of items) {
      if (e.kind === "INCOME") continue; // Exclude income from spending stats

      totalPaidMinor += e.amountMinor;
      if (e.kind === "PERSONAL") {
        personalMinor += e.amountMinor;
        myShareMinor += e.amountMinor;
      } else {
        sharedPaidMinor += e.amountMinor;
        const share = e.myShareMinor ?? e.amountMinor;
        myShareMinor += share;
        const recAmount = Math.max(e.amountMinor - share, 0);
        receivableMinor += recAmount;

        if (recAmount > 0) {
          if (e.notes) {
            try {
              const notesData = JSON.parse(e.notes);
              if (notesData.splitGroup === "FRIENDS") {
                friendsReceivable += recAmount;
              } else {
                familyReceivable += recAmount;
              }
            } catch (err) {
              familyReceivable += recAmount;
            }
          } else {
             familyReceivable += recAmount;
          }
        }
      }
    }

    return {
      totalPaid: fromMinor(totalPaidMinor),
      personal: fromMinor(personalMinor),
      sharedPaid: fromMinor(sharedPaidMinor),
      myShare: fromMinor(myShareMinor),
      receivable: fromMinor(receivableMinor),
      familyReceivable: fromMinor(familyReceivable),
      friendsReceivable: fromMinor(friendsReceivable),
      count: items.filter(i => i.kind !== "INCOME").length,
    };
  }, [listForMonth, month]);

  return (
    <div className="space-y-4 md:space-y-5">
      <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
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

      <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
        <Card className="p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold">Quick insights</div>
              <div className="mt-1 text-xs text-app-muted">
                Your spending breakdown
              </div>
            </div>
            <Button variant="secondary" size="sm" className="hidden sm:flex">
              View
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-3 flex-1">
            <div className="flex items-center gap-3 rounded-2xl border border-app-border/60 bg-app-surface/40 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[rgb(var(--accent))/10] text-[rgb(var(--accent))]">
                <User className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-app-muted">Personal Expenses</div>
                <div className="truncate text-sm font-semibold text-app-foreground">{inr.format(stats.personal)}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10px] font-medium uppercase tracking-wider text-app-muted">Total Paid</div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-app-border/60 bg-app-surface/40 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                <Share2 className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-app-muted">Shared Paid</div>
                <div className="truncate text-sm font-semibold text-app-foreground">{inr.format(stats.sharedPaid)}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10px] font-medium uppercase tracking-wider text-emerald-400/80">Rec {inr.format(stats.receivable)}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-app-border/60 bg-app-surface/40 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                <PieChart className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-app-muted">Effective Cost</div>
                <div className="truncate text-sm font-semibold text-app-foreground">{inr.format(stats.myShare)}</div>
              </div>
              <div className="text-right shrink-0 text-[10px] text-app-muted">
                Your total share
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold">Shared snapshot</div>
              <div className="mt-1 text-xs text-app-muted">Net balances across groups</div>
            </div>
            <Users className="h-5 w-5 text-app-muted" />
          </div>

          <div className="space-y-3 flex-1">
            <div className="rounded-2xl border border-app-border/60 bg-app-surface/40 p-4 h-full flex flex-col justify-center">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                  <div className="text-sm font-semibold">Family</div>
                </div>
                <div className="text-sm font-semibold text-emerald-400">
                  +{inr.format(stats.familyReceivable)}
                </div>
              </div>
              <div className="w-full bg-app-surface/50 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full" style={{ width: stats.familyReceivable > 0 ? '100%' : '0%' }}></div>
              </div>
              <div className="mt-2 text-[10px] text-app-muted uppercase tracking-wider text-right">Pending Receivable</div>
            </div>
            
            <div className="rounded-2xl border border-app-border/60 bg-app-surface/40 p-4 h-full flex flex-col justify-center">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                  <div className="text-sm font-semibold">Friends</div>
                </div>
                <div className="text-sm font-semibold text-blue-400">
                  +{inr.format(stats.friendsReceivable)}
                </div>
              </div>
              <div className="w-full bg-app-surface/50 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-400 h-full rounded-full" style={{ width: stats.friendsReceivable > 0 ? '100%' : '0%' }}></div>
              </div>
              <div className="mt-2 text-[10px] text-app-muted uppercase tracking-wider text-right">Individual Balances</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

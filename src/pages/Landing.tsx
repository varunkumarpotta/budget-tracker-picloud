import { ArrowRight, ShieldCheck, Sparkles, WalletCards } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function Landing() {
  return (
    <div className="min-h-dvh bg-app text-app-foreground">
      <div className="mx-auto max-w-6xl px-4 pb-10 pt-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-[radial-gradient(circle_at_30%_30%,rgba(var(--accent),0.9),rgba(var(--accent),0.2))]" />
            <div className="leading-tight">
              <div className="font-display text-lg tracking-tight">Ledgerly</div>
              <div className="text-xs text-app-muted">Personal + shared + cards</div>
            </div>
          </div>
          <Link to="/auth">
            <Button variant="secondary" size="sm">
              Sign in
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-start">
          <div>
            <h1 className="font-display text-4xl tracking-tight md:text-5xl">
              A calm, premium way to track spending — and your actual share.
            </h1>
            <p className="mt-4 max-w-xl text-sm text-app-muted md:text-base">
              Built for real-life workflows: multiple cards, mixed payment methods, shared expenses,
              statement cycles, and smart monthly clearing — in one daily-use interface.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/auth">
                <Button>
                  Get started
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="ghost">Try demo</Button>
              </Link>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              <Card className="p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Sparkles className="h-4 w-4 text-[rgb(var(--accent))]" />
                  Smart insights
                </div>
                <div className="mt-2 text-xs text-app-muted">
                  Trends, anomalies, subscription detection, and monthly comparisons.
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <WalletCards className="h-4 w-4 text-[rgb(var(--accent))]" />
                  Multi-card cycles
                </div>
                <div className="mt-2 text-xs text-app-muted">
                  Statement locking, due tracking, carry-forward, and payment history.
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheck className="h-4 w-4 text-[rgb(var(--accent))]" />
                  Private by design
                </div>
                <div className="mt-2 text-xs text-app-muted">
                  Store card metadata only, secure sessions, and export/delete controls.
                </div>
              </Card>
            </div>
          </div>

          <Card className="relative overflow-hidden p-5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_25%,rgba(var(--accent),0.30),transparent_55%),radial-gradient(circle_at_70%_65%,rgba(56,189,248,0.18),transparent_55%)]" />
            <div className="relative">
              <div className="text-sm font-semibold">This month</div>
              <div className="mt-1 text-xs text-app-muted">Paid vs actual share</div>

              <div className="mt-5 grid gap-3">
                <div className="rounded-2xl border border-app-border/60 bg-app-surface/40 p-4">
                  <div className="text-xs text-app-muted">Total spending</div>
                  <div className="mt-1 font-display text-2xl tracking-tight">₹ 48,920</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-app-border/60 bg-app-surface/40 p-4">
                    <div className="text-xs text-app-muted">Your share</div>
                    <div className="mt-1 text-lg font-semibold">₹ 31,410</div>
                  </div>
                  <div className="rounded-2xl border border-app-border/60 bg-app-surface/40 p-4">
                    <div className="text-xs text-app-muted">Receivable</div>
                    <div className="mt-1 text-lg font-semibold text-emerald-400">
                      ₹ 17,510
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-app-border/60 bg-app-surface/40 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-app-muted">Card due in 6 days</div>
                      <div className="mt-1 text-lg font-semibold">₹ 12,300</div>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-[radial-gradient(circle_at_30%_30%,rgba(var(--accent),0.9),rgba(var(--accent),0.2))]" />
                  </div>
                </div>
              </div>

              <div className="mt-5 text-xs text-app-muted">
                A production-ready build will connect authentication, storage, and exports.
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-10 border-t border-app-border/50 pt-6 text-xs text-app-muted">
          Ledgerly is a premium expense tracker tailored for shared splits and card workflows.
        </div>
      </div>
    </div>
  );
}


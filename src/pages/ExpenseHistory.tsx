import { Filter, Search, Trash2, Edit2, RotateCcw, X, Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { formatExpenseTime, monthKey } from "@/lib/date";
import { fromMinor, toMinor } from "@/lib/money";
import { refreshExpensesForMonth, useExpenseStore } from "@/stores/expenseStore";

type ExpenseRow = {
  id: string;
  merchant: string;
  category: string;
  payment: string;
  amount: number;
  shared: boolean;
  occurredAt: string;
  rawOccurredAt: string;
  notes?: string | null;
  myShareMinor?: number;
};

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

export default function ExpenseHistory() {
  const [query, setQuery] = useState("");
  const hydrate = useExpenseStore((s) => s.hydrate);
  const listForMonth = useExpenseStore((s) => s.listForMonth);
  const deleteExpense = useExpenseStore((s) => s.deleteExpense);
  const undoDeleteExpense = useExpenseStore((s) => s.undoDeleteExpense);
  const editExpense = useExpenseStore((s) => s.editExpense);
  
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const month = useMemo(() => monthKey(new Date()), []);

  // Expanded and Edit state
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMerchant, setEditMerchant] = useState("");
  const [editAmount, setEditAmount] = useState("");

  useEffect(() => {
    hydrate();
    void refreshExpensesForMonth(month);
  }, [hydrate, month]);

  const rows = useMemo<ExpenseRow[]>(() => {
    return listForMonth(month).map((e) => ({
      id: e.id,
      merchant: e.merchantName,
      category: e.categoryName,
      payment: e.paymentSourceLabel ?? "—",
      amount: fromMinor(e.amountMinor),
      shared: e.kind === "SHARED",
      occurredAt: formatExpenseTime(e.occurredAt),
      rawOccurredAt: e.occurredAt,
      notes: e.notes,
      myShareMinor: e.myShareMinor,
    }));
  }, [listForMonth, month]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (row) =>
        row.merchant.toLowerCase().includes(q) ||
        row.category.toLowerCase().includes(q) ||
        row.payment.toLowerCase().includes(q),
    );
  }, [query, rows]);

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      await deleteExpense(id);
      setDeletedIds((prev) => [...prev, id]);
      
      // Auto-remove the undo option after 10 seconds
      setTimeout(() => {
        setDeletedIds((prev) => prev.filter((dId) => dId !== id));
      }, 10000);
    }
  };

  const handleUndo = async (id: string) => {
    await undoDeleteExpense(id);
    setDeletedIds((prev) => prev.filter((dId) => dId !== id));
  };

  const openEdit = (row: ExpenseRow) => {
    setEditMerchant(row.merchant);
    setEditAmount(row.amount.toString());
    setEditingId(row.id);
  };

  const saveEdit = async () => {
    if (!editingId || !editMerchant.trim() || !editAmount) return;
    
    await editExpense(editingId, {
      merchantName: editMerchant.trim(),
      amountMinor: toMinor(Number(editAmount))
    });
    setEditingId(null);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-muted" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            placeholder="Search merchant, category, payment…"
          />
        </div>
        <button className="inline-flex h-11 items-center gap-2 rounded-xl border border-app-border/60 bg-app-surface/50 px-4 text-sm font-semibold text-app-foreground transition hover:bg-app-surface/70">
          <Filter className="h-4 w-4" />
          Filters
        </button>
      </div>

      <div className="grid gap-3">
        {deletedIds.length > 0 && (
          <Card className="p-4 bg-app-surface/30 border-dashed">
            <div className="flex items-center justify-between">
              <div className="text-sm text-app-muted">Expense deleted.</div>
              <Button size="sm" variant="ghost" onClick={() => handleUndo(deletedIds[deletedIds.length - 1])}>
                <RotateCcw className="h-4 w-4" /> Undo
              </Button>
            </div>
          </Card>
        )}

        {filtered.length === 0 ? (
          <Card className="p-6">
            <div className="text-sm font-semibold">No expenses yet</div>
            <div className="mt-1 text-xs text-app-muted">
              Add your first expense from the “Add” tab.
            </div>
          </Card>
        ) : (
          filtered.map((row) => (
            <Card 
              key={row.id} 
              className={`p-4 group overflow-hidden transition-colors cursor-pointer ${expandedId === row.id ? "bg-app-surface/60" : ""}`}
              onClick={() => {
                if (editingId !== row.id) {
                  setExpandedId(expandedId === row.id ? null : row.id);
                }
              }}
            >
              {editingId === row.id ? (
                <div className="flex items-center gap-3 w-full">
                  <div className="flex-1 space-y-2">
                    <Input 
                      value={editMerchant} 
                      onChange={e => setEditMerchant(e.target.value)} 
                      className="h-8 text-sm" 
                      placeholder="Merchant"
                    />
                  </div>
                  <div className="w-24 space-y-2">
                    <Input 
                      value={editAmount} 
                      onChange={e => setEditAmount(e.target.value)} 
                      className="h-8 text-sm" 
                      placeholder="Amount"
                      type="number"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={saveEdit} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">
                      <Check className="h-4 w-4" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg bg-app-surface/50 text-app-muted hover:text-app-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-sm font-semibold">{row.merchant}</div>
                      {row.shared && (
                        <span className="rounded-full bg-[rgba(var(--accent),0.14)] px-2 py-0.5 text-[11px] font-semibold text-[rgb(var(--accent))]">
                          Shared
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-app-muted">
                      {row.category} · {row.payment}
                    </div>
                    <div className="mt-1 text-xs text-app-muted">{row.occurredAt}</div>
                  </div>

                  <div className="text-right flex flex-col items-end justify-between h-full">
                    <div className="text-sm font-semibold">{inr.format(row.amount)}</div>
                    <div className="mt-2 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <button 
                        onClick={(e) => { e.stopPropagation(); openEdit(row); }} 
                        className="p-1.5 rounded-lg bg-app-surface border border-app-border/40 text-app-muted hover:text-app-foreground"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }} 
                        className="p-1.5 rounded-lg bg-app-surface border border-app-border/40 text-red-400 hover:text-red-500 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {expandedId === row.id && !editingId && (
                <div className="mt-4 pt-3 border-t border-app-border/40 text-sm">
                  {row.shared && row.notes ? (
                    <div className="space-y-2 bg-app-surface/40 p-3 rounded-xl border border-app-border/30">
                      <div className="text-xs font-semibold text-[rgb(var(--accent))] uppercase tracking-wider mb-2">Split Details</div>
                      {(() => {
                        try {
                          const details = JSON.parse(row.notes);
                          return (
                            <>
                              <div className="flex justify-between">
                                <span className="text-app-muted">Group</span>
                                <span className="font-medium">{details.splitGroup}</span>
                              </div>
                              {details.splitType && (
                                <div className="flex justify-between">
                                  <span className="text-app-muted">Type</span>
                                  <span className="font-medium">{details.splitType}</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-app-muted">Your Share</span>
                                <span className="font-medium">{inr.format(fromMinor(row.myShareMinor || 0))}</span>
                              </div>
                              {details.friends && (
                                <div className="mt-2 pt-2 border-t border-app-border/30 space-y-1">
                                  {Object.entries(details.friends).map(([friendId, amt]) => {
                                    // Try to fetch friend name from local storage if possible, else use ID snippet
                                    const stored = localStorage.getItem("ledgerly:friends");
                                    let name = "Friend " + friendId.slice(0, 4);
                                    if (stored) {
                                      const friendsArr = JSON.parse(stored);
                                      const found = friendsArr.find((f: any) => f.id === friendId);
                                      if (found) name = found.name;
                                    }
                                    return (
                                      <div key={friendId} className="flex justify-between text-xs">
                                        <span className="text-app-muted">{name}</span>
                                        <span className="font-medium text-emerald-400">{inr.format(Number(amt))}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </>
                          );
                        } catch (e) {
                          return <div className="text-xs text-app-muted">Invalid details.</div>;
                        }
                      })()}
                    </div>
                  ) : (
                    <div className="text-xs text-app-muted">No additional details for this personal expense.</div>
                  )}
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}


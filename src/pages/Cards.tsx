import { CreditCard, Plus, Edit2, Trash2, Check, X } from "lucide-react";
import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

type CreditCardType = {
  id: string;
  name: string;
  credit_limit_minor: number;
  billing_cycle: string;
  due_day: number;
  outstanding_minor: number;
};

export default function Cards() {
  const [cards, setCards] = useState<CreditCardType[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [limit, setLimit] = useState("");
  const [billingCycle, setBillingCycle] = useState("1st-31st");
  const [dueDay, setDueDay] = useState("1");
  const [outstanding, setOutstanding] = useState("0");

  const fetchCards = async () => {
    try {
      const res = await apiGet<CreditCardType[]>("/api/v1/cards");
      setCards(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const resetForm = () => {
    setName("");
    setLimit("");
    setBillingCycle("1st-31st");
    setDueDay("1");
    setOutstanding("0");
    setIsAdding(false);
    setEditingId(null);
  };

  const openAdd = () => {
    resetForm();
    setIsAdding(true);
  };

  const openEdit = (c: CreditCardType) => {
    setName(c.name);
    setLimit((c.credit_limit_minor / 100).toString());
    setBillingCycle(c.billing_cycle);
    setDueDay(c.due_day.toString());
    setOutstanding((c.outstanding_minor / 100).toString());
    setEditingId(c.id);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    
    const payload = {
      name,
      creditLimitMinor: Math.trunc(Number(limit) * 100) || 0,
      billingCycle,
      dueDay: Number(dueDay) || 1,
      outstandingMinor: Math.trunc(Number(outstanding) * 100) || 0,
    };

    try {
      if (editingId) {
        await apiPut(`/api/v1/cards/${editingId}`, payload);
      } else {
        await apiPost("/api/v1/cards", payload);
      }
      resetForm();
      fetchCards();
    } catch (err) {
      alert("Failed to save card");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this card?")) return;
    try {
      await apiDelete(`/api/v1/cards/${id}`);
      setCards(cards.filter(c => c.id !== id));
    } catch (err) {
      alert("Failed to delete card");
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Payment Methods</div>
          <div className="mt-1 text-xs text-app-muted">
            Manage your credit cards, limits, and statement cycles.
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add card
        </Button>
      </div>

      {(isAdding || editingId) && (
        <Card className="p-5 border-dashed border-app-border">
          <div className="text-sm font-semibold mb-4">{editingId ? "Edit Card" : "New Card"}</div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <div className="mb-1 text-xs font-semibold text-app-muted">Card Name</div>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. HDFC Swiggy" />
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold text-app-muted">Credit Limit</div>
              <Input value={limit} onChange={e => setLimit(e.target.value)} placeholder="0" type="number" />
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold text-app-muted">Billing Cycle</div>
              <Input value={billingCycle} onChange={e => setBillingCycle(e.target.value)} placeholder="e.g. 1st-31st" />
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold text-app-muted">Due Day (1-31)</div>
              <Input value={dueDay} onChange={e => setDueDay(e.target.value)} placeholder="1" type="number" min="1" max="31" />
            </div>
            <div className="md:col-span-2">
              <div className="mb-1 text-xs font-semibold text-app-muted">Current Outstanding</div>
              <Input value={outstanding} onChange={e => setOutstanding(e.target.value)} placeholder="0" type="number" />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={resetForm}>Cancel</Button>
            <Button size="sm" onClick={handleSave}>Save Card</Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="text-sm text-app-muted">Loading cards...</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {cards.map((c) => (
            <Card key={c.id} className="relative overflow-hidden p-5 group">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(var(--accent),0.24),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(56,189,248,0.14),transparent_55%)]" />
              <div className="relative">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">{c.name}</div>
                    <div className="mt-1 text-xs text-app-muted">Billing cycle {c.billing_cycle} (Due: {c.due_day})</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-app-border/60 bg-app-surface/40">
                      <CreditCard className="h-5 w-5 text-app-foreground" />
                    </div>
                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button onClick={() => openEdit(c)} className="p-1 rounded-lg bg-app-surface/50 text-app-muted hover:text-app-foreground"><Edit2 className="h-3.5 w-3.5" /></button>
                      <button onClick={() => handleDelete(c.id)} className="p-1 rounded-lg bg-app-surface/50 text-red-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-app-border/60 bg-app-surface/40 p-4">
                    <div className="text-xs text-app-muted">Outstanding due</div>
                    <div className="mt-1 text-lg font-semibold">
                      {c.outstanding_minor === 0 ? "—" : inr.format(c.outstanding_minor / 100)}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-app-border/60 bg-app-surface/40 p-4">
                    <div className="text-xs text-app-muted">Credit limit</div>
                    <div className="mt-1 text-lg font-semibold">{inr.format(c.credit_limit_minor / 100)}</div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          {cards.length === 0 && !isAdding && (
             <div className="text-sm text-app-muted col-span-2 text-center py-10">No cards added yet.</div>
          )}
        </div>
      )}
    </div>
  );
}


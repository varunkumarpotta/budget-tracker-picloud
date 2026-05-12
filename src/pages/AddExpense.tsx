import { Check, Users, ArrowDownCircle, ArrowUpCircle, Home, UserPlus } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { toMinor } from "@/lib/money";
import { useExpenseStore } from "@/stores/expenseStore";
import { apiGet } from "@/lib/api";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

const INCOME_CATEGORIES = [
  { id: "inc1", name: "Salary", icon: "💰" },
  { id: "inc2", name: "Business", icon: "🏢" },
  { id: "inc3", name: "Freelance", icon: "💻" },
  { id: "inc4", name: "Investment", icon: "📈" },
  { id: "inc5", name: "Gifts", icon: "🎁" },
  { id: "inc6", name: "Other", icon: "💵" },
];

export default function AddExpense() {
  const navigate = useNavigate();
  const addExpense = useExpenseStore((s) => s.addExpense);
  
  const [dbCategories, setDbCategories] = useState<{id: string, name: string, icon?: string | null}[]>([]);
  const [cards, setCards] = useState<{id: string, name: string}[]>([]);
  const [friends, setFriends] = useState<{id: string, name: string}[]>([]);
  
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState("");
  const [payment, setPayment] = useState("");
  
  const [shared, setShared] = useState(false);
  const [sharedWith, setSharedWith] = useState<"FAMILY" | "FRIENDS">("FRIENDS");
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [splitType, setSplitType] = useState<"EQUAL" | "CUSTOM">("EQUAL");
  const [customFriendShares, setCustomFriendShares] = useState<Record<string, string>>({});
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [catsRes, cardsRes] = await Promise.all([
          apiGet<any[]>("/api/v1/categories"),
          apiGet<any[]>("/api/v1/cards")
        ]);
        setDbCategories(catsRes.data);
        setCards(cardsRes.data);
        if (catsRes.data.length > 0) setCategory(catsRes.data[0].name);
        if (cardsRes.data.length > 0) setPayment(cardsRes.data[0].name);
      } catch (err) {
        console.error("Failed to load options");
      }
    }
    loadData();

    const storedFriends = localStorage.getItem("ledgerly:friends");
    if (storedFriends) {
      try {
        setFriends(JSON.parse(storedFriends));
      } catch (e) {}
    }
  }, []);

  const currentCategories = type === "INCOME" ? INCOME_CATEGORIES : dbCategories;

  // Ensure selected category stays valid when switching types
  useEffect(() => {
    if (currentCategories.length > 0 && !currentCategories.find(c => c.name === category)) {
      setCategory(currentCategories[0].name);
    }
  }, [type, currentCategories, category]);

  const parsedAmount = useMemo(() => {
    const n = Number(amount);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [amount]);

  const customSharesTotal = useMemo(() => {
    let sum = 0;
    Object.values(customFriendShares).forEach(val => {
      const n = Number(val);
      if (Number.isFinite(n) && n > 0) sum += n;
    });
    return sum;
  }, [customFriendShares]);

  const calculatedMyShare = useMemo(() => {
    if (!parsedAmount || !shared) return null;
    if (sharedWith === "FAMILY") return parsedAmount / 2; // Default family split assumption
    
    if (splitType === "CUSTOM") {
      return Math.max(parsedAmount - customSharesTotal, 0);
    } else {
      // EQUAL
      const totalPeople = 1 + selectedFriends.length;
      return parsedAmount / totalPeople;
    }
  }, [parsedAmount, shared, sharedWith, splitType, customSharesTotal, selectedFriends.length]);

  const receivable =
    parsedAmount && calculatedMyShare !== null ? Math.max(parsedAmount - calculatedMyShare, 0) : null;

  const canSave = useMemo(() => {
    if (!parsedAmount) return false;
    if (!merchant.trim()) return false;
    if (!category.trim()) return false;
    if (type === "EXPENSE" && shared) {
      if (sharedWith === "FRIENDS" && selectedFriends.length === 0) return false;
      if (calculatedMyShare === null) return false;
    }
    return true;
  }, [category, merchant, parsedAmount, calculatedMyShare, shared, sharedWith, selectedFriends, type]);

  const toggleFriend = (id: string) => {
    setSelectedFriends(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const handleCustomShareChange = (friendId: string, val: string) => {
    setCustomFriendShares(prev => ({ ...prev, [friendId]: val }));
  };

  async function onSave() {
    setError(null);
    if (!canSave || !parsedAmount) return;

    const finalShare = type === "EXPENSE" && shared ? calculatedMyShare || 0 : parsedAmount;
    const occurredAt = new Date().toISOString();
    
    let notesData = null;
    if (type === "EXPENSE" && shared) {
      if (sharedWith === "FAMILY") {
        notesData = JSON.stringify({ splitGroup: "FAMILY", receivable });
      } else {
        notesData = JSON.stringify({
          splitGroup: "FRIENDS",
          splitType,
          friends: splitType === "EQUAL" 
            ? selectedFriends.reduce((acc, fId) => ({...acc, [fId]: receivable ? receivable / selectedFriends.length : 0}), {}) 
            : customFriendShares
        });
      }
    }

    setSaving(true);
    try {
      await addExpense({
        occurredAt,
        amountMinor: toMinor(parsedAmount),
        currency: "INR",
        merchantName: merchant.trim(),
        categoryName: category,
        paymentSourceLabel: payment,
        kind: type === "INCOME" ? "INCOME" : (shared ? "SHARED" : "PERSONAL"),
        groupId: null,
        myShareMinor: toMinor(Math.min(finalShare, parsedAmount)),
        notes: notesData,
      });
      navigate("/app/expenses", { replace: true });
    } catch {
      setError("Could not save entry. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Card className="p-5">
        <div className="flex bg-app-surface/40 p-1 rounded-xl mb-6">
          <button
            onClick={() => { setType("EXPENSE"); setShared(false); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition ${type === "EXPENSE" ? "bg-app-surface text-app-foreground shadow-sm" : "text-app-muted hover:text-app-foreground"}`}
          >
            <ArrowDownCircle className="h-4 w-4 text-red-400" /> Expense
          </button>
          <button
            onClick={() => { setType("INCOME"); setShared(false); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition ${type === "INCOME" ? "bg-app-surface text-app-foreground shadow-sm" : "text-app-muted hover:text-app-foreground"}`}
          >
            <ArrowUpCircle className="h-4 w-4 text-emerald-400" /> Income
          </button>
        </div>

        <div className="text-sm font-semibold">Fast entry</div>
        <div className="mt-1 text-xs text-app-muted">
          One screen. Smart defaults.
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <div className="mb-1 text-xs font-semibold text-app-muted">Amount</div>
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              inputMode="decimal"
              className="text-lg font-semibold"
            />
          </div>

          <div className="md:col-span-2">
            <div className="mb-1 text-xs font-semibold text-app-muted">{type === "INCOME" ? "Source / Sender" : "Merchant"}</div>
            <Input
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder={type === "INCOME" ? "Salary, Upwork, Client..." : "Swiggy, Zomato, Netflix…"}
            />
          </div>

          <div className="md:col-span-2">
            <div className="mb-2 text-xs font-semibold text-app-muted">Category</div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {currentCategories.map(c => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.name)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl whitespace-nowrap text-sm font-medium transition flex-shrink-0 ${
                    category === c.name 
                      ? "bg-[rgb(var(--accent))] text-[rgb(var(--accent-foreground))]" 
                      : "bg-app-surface border border-app-border/40 text-app-muted hover:border-app-border"
                  }`}
                >
                  <span className="text-base">{c.icon || "🏷️"}</span>
                  {c.name}
                </button>
              ))}
              {currentCategories.length === 0 && <span className="text-sm text-app-muted">No categories available</span>}
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="mb-1 text-xs font-semibold text-app-muted">{type === "INCOME" ? "Destination Account" : "Payment source"}</div>
            <select
              value={payment}
              onChange={(e) => setPayment(e.target.value)}
              className="h-11 w-full rounded-xl border border-app-border/70 bg-app-surface/40 px-3 text-sm text-app-foreground outline-none transition focus:border-app-border focus:bg-app-surface/60 focus:ring-2 focus:ring-[rgba(var(--accent),0.24)]"
            >
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Debit Card">Debit Card</option>
              {cards.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          {type === "EXPENSE" && (
            <div className="md:col-span-2 mt-2 flex items-center justify-between rounded-2xl border border-app-border/60 bg-app-surface/35 px-4 py-3">
              <div>
                <div className="text-sm font-semibold">Shared expense</div>
                <div className="mt-1 text-xs text-app-muted">
                  Track the amount you can recover.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShared((s) => !s)}
                className="relative inline-flex h-9 w-14 items-center rounded-full border border-app-border/60 bg-app-surface/50 transition"
              >
                <span
                  className={`absolute left-1 top-1 inline-flex h-7 w-7 items-center justify-center rounded-full transition ${
                    shared
                      ? "translate-x-5 bg-[rgb(var(--accent))] text-[rgb(var(--accent-foreground))]"
                      : "translate-x-0 bg-app-surface text-app-muted"
                  }`}
                >
                  <Check className="h-4 w-4" />
                </span>
              </button>
            </div>
          )}
        </div>
      </Card>

      {shared && type === "EXPENSE" && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Users className="h-4 w-4 text-[rgb(var(--accent))]" />
              Split details
            </div>
          </div>
          
          <div className="flex bg-app-surface/40 p-1 rounded-xl mb-4">
            <button
              onClick={() => setSharedWith("FRIENDS")}
              className={`flex-1 flex justify-center items-center gap-2 py-1.5 text-xs font-semibold rounded-lg transition ${sharedWith === "FRIENDS" ? "bg-app-surface text-app-foreground shadow-sm" : "text-app-muted hover:text-app-foreground"}`}
            >
              <UserPlus className="h-3.5 w-3.5" /> Friends
            </button>
            <button
              onClick={() => setSharedWith("FAMILY")}
              className={`flex-1 flex justify-center items-center gap-2 py-1.5 text-xs font-semibold rounded-lg transition ${sharedWith === "FAMILY" ? "bg-app-surface text-app-foreground shadow-sm" : "text-app-muted hover:text-app-foreground"}`}
            >
              <Home className="h-3.5 w-3.5" /> Family
            </button>
          </div>

          {sharedWith === "FAMILY" ? (
             <div className="text-sm text-app-muted text-center py-4 bg-app-surface/30 rounded-xl border border-app-border/40">
               Adding to generic Family shared expenses.
             </div>
          ) : (
            <>
              <div className="mt-2">
                <div className="mb-2 text-xs font-semibold text-app-muted">Select Friends</div>
                <div className="flex flex-wrap gap-2">
                  {friends.length === 0 && <span className="text-xs text-app-muted italic">No friends added. Go to Shared page to add.</span>}
                  {friends.map(f => (
                    <button
                      key={f.id}
                      onClick={() => toggleFriend(f.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                        selectedFriends.includes(f.id) 
                          ? "bg-[rgb(var(--accent))] text-[rgb(var(--accent-foreground))]" 
                          : "bg-app-surface border border-app-border/40 text-app-muted"
                      }`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>

              {selectedFriends.length > 0 && (
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <div>
                    <div className="flex bg-app-surface/40 p-1 rounded-xl mb-3">
                      <button
                        onClick={() => setSplitType("EQUAL")}
                        className={`flex-1 flex justify-center py-1.5 text-xs font-semibold rounded-lg transition ${splitType === "EQUAL" ? "bg-app-surface text-app-foreground shadow-sm" : "text-app-muted hover:text-app-foreground"}`}
                      >
                        Split Equally
                      </button>
                      <button
                        onClick={() => setSplitType("CUSTOM")}
                        className={`flex-1 flex justify-center py-1.5 text-xs font-semibold rounded-lg transition ${splitType === "CUSTOM" ? "bg-app-surface text-app-foreground shadow-sm" : "text-app-muted hover:text-app-foreground"}`}
                      >
                        Custom Shares
                      </button>
                    </div>
                    
                    {splitType === "CUSTOM" && (
                      <div className="space-y-2 mt-3">
                        {selectedFriends.map(fId => {
                          const friend = friends.find(f => f.id === fId);
                          return (
                            <div key={fId} className="flex items-center gap-2">
                              <span className="text-xs font-semibold flex-1">{friend?.name}</span>
                              <Input
                                value={customFriendShares[fId] || ""}
                                onChange={(e) => handleCustomShareChange(fId, e.target.value)}
                                placeholder="0"
                                inputMode="decimal"
                                className="w-24 h-8 text-xs"
                              />
                            </div>
                          );
                        })}
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-app-border/40">
                          <span className="text-xs font-semibold flex-1 text-app-muted">Your Share (Auto)</span>
                          <span className="text-sm font-semibold">{inr.format(calculatedMyShare || 0)}</span>
                        </div>
                      </div>
                    )}
                    
                    {splitType === "EQUAL" && (
                      <div className="text-sm text-app-muted mt-2">
                        Splitting {inr.format(parsedAmount || 0)} equally between you and {selectedFriends.length} friend(s).
                      </div>
                    )}
                  </div>
                  <div className="rounded-2xl border border-app-border/60 bg-app-surface/40 p-4">
                    <div className="text-xs text-app-muted">Receivable</div>
                    <div className="mt-1 text-lg font-semibold text-emerald-400">
                      {receivable === null ? "—" : inr.format(receivable)}
                    </div>
                    <div className="mt-1 text-xs text-app-muted">
                      Total owed to you
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      )}

      <div className="flex justify-end gap-3">
        <Button onClick={onSave} disabled={!canSave || saving}>
          {saving ? "Saving..." : `Save ${type === "INCOME" ? "Income" : "Expense"}`}
        </Button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}
    </div>
  );
}




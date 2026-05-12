import { ArrowRightLeft, Plus, Users, UserPlus, Trash2, Home } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { useExpenseStore } from "@/stores/expenseStore";
import { fromMinor } from "@/lib/money";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

export default function Shared() {
  const expenses = useExpenseStore((s) => s.expenses);
  const hydrate = useExpenseStore((s) => s.hydrate);

  const [friends, setFriends] = useState<{id: string, name: string}[]>([]);
  const [newFriend, setNewFriend] = useState("");
  const [isAddingFriend, setIsAddingFriend] = useState(false);

  useEffect(() => {
    hydrate();
    const stored = localStorage.getItem("ledgerly:friends");
    if (stored) {
      try {
        setFriends(JSON.parse(stored));
      } catch (e) {
        // ignore
      }
    } else {
      // default friends list for demo
      const defaults = [
        { id: "1", name: "Rahul" },
        { id: "2", name: "Priya" },
        { id: "3", name: "Amit" }
      ];
      setFriends(defaults);
      localStorage.setItem("ledgerly:friends", JSON.stringify(defaults));
    }
  }, [hydrate]);

  const addFriend = () => {
    if (!newFriend.trim()) return;
    const updated = [...friends, { id: Date.now().toString(), name: newFriend.trim() }];
    setFriends(updated);
    localStorage.setItem("ledgerly:friends", JSON.stringify(updated));
    setNewFriend("");
    setIsAddingFriend(false);
  };

  const removeFriend = (id: string) => {
    const updated = friends.filter(f => f.id !== id);
    setFriends(updated);
    localStorage.setItem("ledgerly:friends", JSON.stringify(updated));
  };

  const sharedStats = useMemo(() => {
    let totalReceivable = 0;
    let familyReceivable = 0;
    const recentShared: any[] = [];
    const friendBalances: Record<string, number> = {};

    friends.forEach(f => { friendBalances[f.id] = 0; });

    expenses.forEach((e) => {
      if (e.kind === "SHARED") {
        const amount = fromMinor(e.amountMinor);
        const myShare = e.myShareMinor !== null && e.myShareMinor !== undefined 
          ? fromMinor(e.myShareMinor) 
          : amount;
        
        const receivableAmount = amount - myShare;

        if (receivableAmount > 0) {
          totalReceivable += receivableAmount;
          
          if (recentShared.length < 5) {
            recentShared.push({
              id: e.id,
              merchant: e.merchantName,
              paid: amount,
              share: myShare,
              receivable: receivableAmount,
              date: new Date(e.occurredAt).toLocaleDateString()
            });
          }

          if (e.notes) {
            try {
              const notesData = JSON.parse(e.notes);
              if (notesData.splitGroup === "FAMILY") {
                familyReceivable += receivableAmount;
              } else if (notesData.splitGroup === "FRIENDS" && notesData.friends) {
                Object.entries(notesData.friends).forEach(([fId, val]) => {
                  const shareVal = Number(val);
                  if (friendBalances[fId] !== undefined && !isNaN(shareVal)) {
                    friendBalances[fId] += shareVal;
                  }
                });
              }
            } catch (err) {
              // Ignore parse errors for older data without notes
            }
          } else {
             // Legacy generic shared items, put under family
             familyReceivable += receivableAmount;
          }
        }
      }
    });

    return { totalReceivable, familyReceivable, recentShared, friendBalances };
  }, [expenses, friends]);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Shared Expenses</div>
          <div className="mt-1 text-xs text-app-muted">
            Track balances, net settlement, and manage friends.
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Card className="p-4 flex flex-col">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[rgb(var(--accent))]" />
              <div>
                <div className="text-sm font-semibold">Overview</div>
                <div className="mt-1 text-xs text-app-muted">All shared expenses</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-emerald-400">
                +{inr.format(sharedStats.totalReceivable)}
              </div>
              <div className="mt-1 text-xs text-app-muted">Total you are owed</div>
            </div>
          </div>

          <div className="mt-4 flex-1">
            <div className="mb-2 text-xs font-semibold text-app-muted">Recent Shared Activity</div>
            <div className="grid gap-2">
              {sharedStats.recentShared.length === 0 ? (
                <div className="text-xs text-app-muted text-center py-4 bg-app-surface/30 rounded-xl border border-dashed border-app-border/40">No active shared expenses.</div>
              ) : (
                sharedStats.recentShared.map((item) => (
                  <div key={item.id} className="rounded-xl border border-app-border/60 bg-app-surface/40 px-3 py-2 text-xs flex justify-between items-center">
                    <div>
                      <div className="font-medium text-app-foreground">{item.merchant}</div>
                      <div className="text-app-muted mt-0.5">{item.date}</div>
                    </div>
                    <span className="text-emerald-400 font-medium">+{inr.format(item.receivable)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-app-border/40 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-app-surface rounded-lg text-app-muted"><Home className="w-4 h-4" /></div>
              <span className="text-xs font-medium text-app-muted">Family Pool</span>
            </div>
            <span className="text-sm font-semibold text-emerald-400">+{inr.format(sharedStats.familyReceivable)}</span>
          </div>
        </Card>

        <Card className="p-4 flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[rgb(var(--accent))]" />
              <div>
                <div className="text-sm font-semibold">Friends List & Balances</div>
                <div className="mt-1 text-xs text-app-muted">{friends.length} members tracked individually</div>
              </div>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setIsAddingFriend(!isAddingFriend)}>
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>

          {isAddingFriend && (
            <div className="flex items-center gap-2 mb-3">
              <Input 
                value={newFriend} 
                onChange={e => setNewFriend(e.target.value)} 
                placeholder="Friend's name" 
                className="h-8 text-xs" 
                autoFocus
              />
              <Button size="sm" onClick={addFriend}>Add</Button>
            </div>
          )}

          <div className="grid gap-2 overflow-y-auto pr-1 flex-1">
            {friends.length === 0 ? (
              <div className="text-xs text-app-muted text-center py-4 bg-app-surface/30 rounded-xl border border-dashed border-app-border/40">No friends added yet.</div>
            ) : (
              friends.map(f => {
                const balance = sharedStats.friendBalances[f.id] || 0;
                return (
                  <div key={f.id} className="flex justify-between items-center rounded-xl border border-app-border/60 bg-app-surface/40 px-3 py-2.5 text-sm">
                    <div className="font-medium text-app-foreground">{f.name}</div>
                    <div className="flex items-center gap-3">
                      {balance > 0 ? (
                        <span className="text-emerald-400 font-semibold text-xs text-right">owes you<br/>{inr.format(balance)}</span>
                      ) : (
                        <span className="text-app-muted text-xs font-medium">Settled</span>
                      )}
                      <button onClick={() => removeFriend(f.id)} className="text-app-muted hover:text-red-400 p-1 bg-app-surface/50 rounded-lg">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Settle up</div>
            <div className="mt-1 text-xs text-app-muted">
              Record a payment to clear balances with friends or family.
            </div>
          </div>
          <Button size="sm">
            <ArrowRightLeft className="h-4 w-4" />
            Record settlement
          </Button>
        </div>
      </Card>
    </div>
  );
}



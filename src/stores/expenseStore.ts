import { create } from "zustand";
import { randomUUID } from "@/lib/uuid";
import type { CreateExpenseInput, Expense } from "@/types/expense";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { monthKey } from "@/lib/date";

type ExpenseState = {
  hydrated: boolean;
  expenses: Expense[];
  hydrate: () => void;
  listForMonth: (month: string) => Expense[];
  upsertMany: (items: Expense[]) => void;
  addExpense: (input: CreateExpenseInput) => Promise<string>;
  editExpense: (id: string, input: Partial<CreateExpenseInput>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  undoDeleteExpense: (id: string) => Promise<void>;
};

const storageKey = "ledgerly:expenses:v1";

function readLocal(): Expense[] {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Expense[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    localStorage.removeItem(storageKey);
    return [];
  }
}

function writeLocal(items: Expense[]) {
  localStorage.setItem(storageKey, JSON.stringify(items));
}

function getString(row: Record<string, unknown>, key: string) {
  const v = row[key];
  return typeof v === "string" ? v : null;
}

function getNumber(row: Record<string, unknown>, key: string) {
  const v = row[key];
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim()) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function normalizeServerExpense(row: Record<string, unknown>): Expense {
  return {
    id: getString(row, "id") ?? randomUUID(),
    occurredAt: new Date(getString(row, "occurred_at") ?? getString(row, "occurredAt") ?? Date.now()).toISOString(),
    amountMinor:
      getNumber(row, "amount_minor") ?? getNumber(row, "amountMinor") ?? 0,
    currency: getString(row, "currency") ?? "INR",
    merchantName:
      getString(row, "merchant_name") ?? getString(row, "merchantName") ?? "",
    categoryName:
      getString(row, "category_name") ?? getString(row, "categoryName") ?? "",
    paymentSourceLabel:
      getString(row, "payment_source_label") ??
      getString(row, "paymentSourceLabel") ??
      getString(row, "paymentSourceId") ??
      null,
    kind: ((getString(row, "kind") ?? "PERSONAL") as Expense["kind"]),
    groupId: getString(row, "group_id") ?? getString(row, "groupId") ?? null,
    myShareMinor:
      getNumber(row, "my_share_minor") ?? getNumber(row, "myShareMinor"),
    notes: getString(row, "notes"),
  };
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  hydrated: false,
  expenses: [],
  hydrate: () => {
    if (get().hydrated) return;
    set({ expenses: readLocal(), hydrated: true });
  },
  listForMonth: (month) =>
    get()
      .expenses.filter((e) => monthKey(new Date(e.occurredAt)) === month)
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)),
  upsertMany: (items) => {
    const existing = new Map(get().expenses.map((e) => [e.id, e]));
    for (const item of items) existing.set(item.id, item);
    const merged = Array.from(existing.values()).sort((a, b) =>
      b.occurredAt.localeCompare(a.occurredAt),
    );
    set({ expenses: merged });
    writeLocal(merged);
  },
  addExpense: async (input) => {
    const localId = randomUUID();
    const localExpense: Expense = { ...input, id: localId };

    const next = [localExpense, ...get().expenses].sort((a, b) =>
      b.occurredAt.localeCompare(a.occurredAt),
    );
    set({ expenses: next });
    writeLocal(next);

    try {
      const res = await apiPost<{ id: string }>("/api/v1/expenses", {
        occurredAt: input.occurredAt,
        amountMinor: input.amountMinor,
        currency: input.currency,
        merchantName: input.merchantName,
        categoryName: input.categoryName,
        paymentSourceLabel: input.paymentSourceLabel,
        kind: input.kind,
        groupId: input.groupId,
        myShareMinor: input.myShareMinor,
        notes: input.notes,
      });
      const serverId = res.data.id;
      if (serverId && serverId !== localId) {
        const replaced = get().expenses.map((e) =>
          e.id === localId ? { ...e, id: serverId } : e,
        );
        set({ expenses: replaced });
        writeLocal(replaced);
      }
      return serverId ?? localId;
    } catch {
      return localId;
    }
  },
  editExpense: async (id, input) => {
    const expenses = get().expenses.map((e) =>
      e.id === id ? { ...e, ...input } : e
    );
    set({ expenses });
    writeLocal(expenses);
    try {
      await apiPut(`/api/v1/expenses/${id}`, input);
    } catch {
      // Ignore
    }
  },
  deleteExpense: async (id) => {
    const expenses = get().expenses.filter((e) => e.id !== id);
    set({ expenses });
    writeLocal(expenses);
    try {
      await apiDelete(`/api/v1/expenses/${id}`);
    } catch {
      // Ignore
    }
  },
  undoDeleteExpense: async (id) => {
    try {
      await apiPost(`/api/v1/expenses/${id}/undo`, {});
      // Refresh to get the restored expense back into the list
      // Since we don't have the full object locally anymore
      const month = monthKey(new Date());
      refreshExpensesForMonth(month);
    } catch {
      // Ignore
    }
  },
}));

export async function refreshExpensesForMonth(month: string) {
  const store = useExpenseStore.getState();
  store.hydrate();
  try {
    const res = await apiGet<unknown[]>(
      `/api/v1/expenses?month=${encodeURIComponent(month)}`,
    );
    const normalized = res.data
      .filter((r): r is Record<string, unknown> => typeof r === "object" && r !== null)
      .map(normalizeServerExpense);
    store.upsertMany(normalized);
  } catch {
    return;
  }
}

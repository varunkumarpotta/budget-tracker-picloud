export type ExpenseKind = "PERSONAL" | "SHARED" | "INCOME";

export type Expense = {
  id: string;
  occurredAt: string;
  amountMinor: number;
  currency: string;
  merchantName: string;
  categoryName: string;
  paymentSourceLabel: string | null;
  kind: ExpenseKind;
  groupId: string | null;
  myShareMinor: number | null;
  notes: string | null;
};

export type CreateExpenseInput = Omit<Expense, "id">;


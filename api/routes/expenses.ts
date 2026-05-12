import { Router, type Request, type Response } from "express";
import { randomUUID } from "crypto";
import { getPool } from "../db/pool.js";
import { getUserId } from "../middleware/auth.js";

const router = Router();

/**
 * GET /api/v1/expenses – list expenses for a month
 */
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const pool = getPool();
  const userId = getUserId(req);
  const month = typeof req.query.month === "string" ? req.query.month : null;
  const includeDeleted = req.query.includeDeleted === "true";

  const deletedClause = includeDeleted ? "" : "and deleted_at is null";

  const whereMonth =
    month && /^\d{4}-\d{2}$/.test(month)
      ? "and occurred_at >= ($2::date) and occurred_at < (($2::date) + interval '1 month')"
      : "";

  const values = month && whereMonth ? [userId, `${month}-01`] : [userId];

  const result = await pool.query(
    `
      select id, occurred_at, amount_minor, currency, merchant_name, category_name, kind, group_id, my_share_minor, payment_source_id, payment_source_label, notes, deleted_at
      from expenses
      where user_id = $1 ${deletedClause}
      ${whereMonth}
      order by occurred_at desc
      limit 200
    `,
    values,
  );

  res.json({ success: true, data: result.rows });
});

/**
 * GET /api/v1/expenses/range – get expenses in a date range (for reports)
 */
router.get("/range", async (req: Request, res: Response): Promise<void> => {
  const pool = getPool();
  const userId = getUserId(req);
  const from = typeof req.query.from === "string" ? req.query.from : null;
  const to = typeof req.query.to === "string" ? req.query.to : null;

  if (!from || !to) {
    res.status(400).json({ success: false, error: "from and to query params are required" });
    return;
  }

  const result = await pool.query(
    `
      select id, occurred_at, amount_minor, currency, merchant_name, category_name, kind, group_id, my_share_minor, payment_source_id, payment_source_label, notes
      from expenses
      where user_id = $1 and deleted_at is null
        and occurred_at >= $2::date and occurred_at < ($3::date + interval '1 day')
      order by occurred_at desc
      limit 5000
    `,
    [userId, from, to],
  );

  res.json({ success: true, data: result.rows });
});

/**
 * POST /api/v1/expenses – create a new expense
 */
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const pool = getPool();
  const userId = getUserId(req);

  const occurredAt = typeof req.body?.occurredAt === "string" ? req.body.occurredAt : null;
  const amountMinor = Number(req.body?.amountMinor);
  const currency = typeof req.body?.currency === "string" ? req.body.currency : "INR";
  const merchantName =
    typeof req.body?.merchantName === "string" ? req.body.merchantName : null;
  const categoryName =
    typeof req.body?.categoryName === "string" ? req.body.categoryName : null;
  const paymentSourceId =
    typeof req.body?.paymentSourceId === "string" ? req.body.paymentSourceId : null;
  const paymentSourceLabel =
    typeof req.body?.paymentSourceLabel === "string"
      ? req.body.paymentSourceLabel
      : null;
  const kind = typeof req.body?.kind === "string" ? req.body.kind : "PERSONAL";
  const groupId = typeof req.body?.groupId === "string" ? req.body.groupId : null;
  const myShareMinor =
    req.body?.myShareMinor === null || req.body?.myShareMinor === undefined
      ? null
      : Number(req.body.myShareMinor);
  const notes = typeof req.body?.notes === "string" ? req.body.notes : null;

  if (!occurredAt || !Number.isFinite(amountMinor) || amountMinor <= 0 || !merchantName || !categoryName) {
    res.status(400).json({ success: false, error: "Invalid payload" });
    return;
  }

  const id = randomUUID();
  await pool.query(
    `
      insert into expenses (
        id, user_id, occurred_at, amount_minor, currency, merchant_name, category_name,
        payment_source_id, payment_source_label, kind, group_id, my_share_minor, notes
      )
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    `,
    [
      id,
      userId,
      occurredAt,
      Math.trunc(amountMinor),
      currency,
      merchantName,
      categoryName,
      paymentSourceId,
      paymentSourceLabel,
      kind,
      groupId,
      myShareMinor === null ? null : Math.trunc(myShareMinor),
      notes,
    ],
  );

  res.status(201).json({ success: true, data: { id } });
});

/**
 * PUT /api/v1/expenses/:id – update an expense
 */
router.put("/:id", async (req: Request, res: Response): Promise<void> => {
  const pool = getPool();
  const userId = getUserId(req);
  const { id } = req.params;

  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  const allowed = [
    ["occurredAt", "occurred_at", "string"],
    ["amountMinor", "amount_minor", "number"],
    ["currency", "currency", "string"],
    ["merchantName", "merchant_name", "string"],
    ["categoryName", "category_name", "string"],
    ["paymentSourceLabel", "payment_source_label", "string"],
    ["kind", "kind", "string"],
    ["groupId", "group_id", "string"],
    ["myShareMinor", "my_share_minor", "number"],
    ["notes", "notes", "string"],
  ] as const;

  for (const [jsKey, dbKey, type] of allowed) {
    if (req.body?.[jsKey] !== undefined) {
      const val = req.body[jsKey];
      if (val === null) {
        fields.push(`${dbKey} = $${idx++}`);
        values.push(null);
      } else if (type === "number") {
        fields.push(`${dbKey} = $${idx++}`);
        values.push(Math.trunc(Number(val)));
      } else {
        fields.push(`${dbKey} = $${idx++}`);
        values.push(String(val));
      }
    }
  }

  if (fields.length === 0) {
    res.status(400).json({ success: false, error: "No fields to update" });
    return;
  }

  fields.push(`updated_at = now()`);

  const result = await pool.query(
    `update expenses set ${fields.join(", ")} where id = $${idx} and user_id = $${idx + 1} and deleted_at is null returning id`,
    [...values, id, userId],
  );

  if (result.rowCount === 0) {
    res.status(404).json({ success: false, error: "Expense not found" });
    return;
  }

  res.json({ success: true, data: { id } });
});

/**
 * DELETE /api/v1/expenses/:id – soft-delete an expense
 */
router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  const pool = getPool();
  const userId = getUserId(req);
  const { id } = req.params;

  const result = await pool.query(
    `update expenses set deleted_at = now() where id = $1 and user_id = $2 and deleted_at is null returning id`,
    [id, userId],
  );

  if (result.rowCount === 0) {
    res.status(404).json({ success: false, error: "Expense not found" });
    return;
  }

  res.json({ success: true, data: { id } });
});

/**
 * POST /api/v1/expenses/:id/undo – undo soft-delete
 */
router.post("/:id/undo", async (req: Request, res: Response): Promise<void> => {
  const pool = getPool();
  const userId = getUserId(req);
  const { id } = req.params;

  const result = await pool.query(
    `update expenses set deleted_at = null where id = $1 and user_id = $2 and deleted_at is not null returning id`,
    [id, userId],
  );

  if (result.rowCount === 0) {
    res.status(404).json({ success: false, error: "Expense not found or not deleted" });
    return;
  }

  res.json({ success: true, data: { id } });
});

export default router;

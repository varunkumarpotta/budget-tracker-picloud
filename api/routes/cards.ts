import { Router, type Request, type Response } from "express";
import { randomUUID } from "crypto";
import { getPool } from "../db/pool.js";
import { getUserId } from "../middleware/auth.js";

const router = Router();

/**
 * GET /api/v1/cards – list user's credit cards
 */
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const pool = getPool();
  const userId = getUserId(req);

  const result = await pool.query(
    `select id, name, credit_limit_minor, billing_cycle, due_day, outstanding_minor, created_at, updated_at
     from cards where user_id = $1 order by created_at desc`,
    [userId],
  );

  res.json({ success: true, data: result.rows });
});

/**
 * POST /api/v1/cards – add a credit card
 */
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const pool = getPool();
  const userId = getUserId(req);

  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const creditLimitMinor = Number(req.body?.creditLimitMinor) || 0;
  const billingCycle = typeof req.body?.billingCycle === "string" ? req.body.billingCycle : "1st–31st";
  const dueDay = Number(req.body?.dueDay) || 1;
  const outstandingMinor = Number(req.body?.outstandingMinor) || 0;

  if (!name) {
    res.status(400).json({ success: false, error: "Card name is required" });
    return;
  }

  const id = randomUUID();
  await pool.query(
    `insert into cards (id, user_id, name, credit_limit_minor, billing_cycle, due_day, outstanding_minor)
     values ($1, $2, $3, $4, $5, $6, $7)`,
    [id, userId, name, Math.trunc(creditLimitMinor), billingCycle, dueDay, Math.trunc(outstandingMinor)],
  );

  res.status(201).json({ success: true, data: { id } });
});

/**
 * PUT /api/v1/cards/:id – update a card
 */
router.put("/:id", async (req: Request, res: Response): Promise<void> => {
  const pool = getPool();
  const userId = getUserId(req);
  const { id } = req.params;

  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (typeof req.body?.name === "string") {
    fields.push(`name = $${idx++}`);
    values.push(req.body.name.trim());
  }
  if (req.body?.creditLimitMinor !== undefined) {
    fields.push(`credit_limit_minor = $${idx++}`);
    values.push(Math.trunc(Number(req.body.creditLimitMinor)));
  }
  if (typeof req.body?.billingCycle === "string") {
    fields.push(`billing_cycle = $${idx++}`);
    values.push(req.body.billingCycle);
  }
  if (req.body?.dueDay !== undefined) {
    fields.push(`due_day = $${idx++}`);
    values.push(Number(req.body.dueDay));
  }
  if (req.body?.outstandingMinor !== undefined) {
    fields.push(`outstanding_minor = $${idx++}`);
    values.push(Math.trunc(Number(req.body.outstandingMinor)));
  }

  if (fields.length === 0) {
    res.status(400).json({ success: false, error: "No fields to update" });
    return;
  }

  fields.push(`updated_at = now()`);

  const result = await pool.query(
    `update cards set ${fields.join(", ")} where id = $${idx} and user_id = $${idx + 1} returning *`,
    [...values, id, userId],
  );

  if (result.rowCount === 0) {
    res.status(404).json({ success: false, error: "Card not found" });
    return;
  }

  res.json({ success: true, data: result.rows[0] });
});

/**
 * DELETE /api/v1/cards/:id – delete a card
 */
router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  const pool = getPool();
  const userId = getUserId(req);
  const { id } = req.params;

  const result = await pool.query(
    `delete from cards where id = $1 and user_id = $2 returning id`,
    [id, userId],
  );

  if (result.rowCount === 0) {
    res.status(404).json({ success: false, error: "Card not found" });
    return;
  }

  res.json({ success: true, data: { id } });
});

export default router;

import { Router, type Request, type Response } from "express";
import { randomUUID } from "crypto";
import { getPool } from "../db/pool.js";
import { getUserId } from "../middleware/auth.js";

const router = Router();

/**
 * GET /api/v1/alerts – list user's budget alerts
 */
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const pool = getPool();
  const userId = getUserId(req);

  const result = await pool.query(
    `select id, name, category_name, threshold_minor, period, enabled, created_at, updated_at
     from alerts where user_id = $1 order by created_at desc`,
    [userId],
  );

  res.json({ success: true, data: result.rows });
});

/**
 * POST /api/v1/alerts – create a budget alert
 */
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const pool = getPool();
  const userId = getUserId(req);

  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const categoryName = typeof req.body?.categoryName === "string" ? req.body.categoryName : null;
  const thresholdMinor = Number(req.body?.thresholdMinor);
  const period = typeof req.body?.period === "string" ? req.body.period : "monthly";

  if (!name || !Number.isFinite(thresholdMinor) || thresholdMinor <= 0) {
    res.status(400).json({ success: false, error: "Name and threshold (> 0) are required" });
    return;
  }

  const id = randomUUID();
  await pool.query(
    `insert into alerts (id, user_id, name, category_name, threshold_minor, period)
     values ($1, $2, $3, $4, $5, $6)`,
    [id, userId, name, categoryName, Math.trunc(thresholdMinor), period],
  );

  res.status(201).json({ success: true, data: { id, name, categoryName, thresholdMinor: Math.trunc(thresholdMinor), period, enabled: true } });
});

/**
 * PUT /api/v1/alerts/:id – update an alert
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
  if (req.body?.categoryName !== undefined) {
    fields.push(`category_name = $${idx++}`);
    values.push(req.body.categoryName === null ? null : String(req.body.categoryName));
  }
  if (req.body?.thresholdMinor !== undefined) {
    fields.push(`threshold_minor = $${idx++}`);
    values.push(Math.trunc(Number(req.body.thresholdMinor)));
  }
  if (typeof req.body?.period === "string") {
    fields.push(`period = $${idx++}`);
    values.push(req.body.period);
  }
  if (typeof req.body?.enabled === "boolean") {
    fields.push(`enabled = $${idx++}`);
    values.push(req.body.enabled);
  }

  if (fields.length === 0) {
    res.status(400).json({ success: false, error: "No fields to update" });
    return;
  }

  fields.push(`updated_at = now()`);

  const result = await pool.query(
    `update alerts set ${fields.join(", ")} where id = $${idx} and user_id = $${idx + 1} returning *`,
    [...values, id, userId],
  );

  if (result.rowCount === 0) {
    res.status(404).json({ success: false, error: "Alert not found" });
    return;
  }

  res.json({ success: true, data: result.rows[0] });
});

/**
 * DELETE /api/v1/alerts/:id – delete an alert
 */
router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  const pool = getPool();
  const userId = getUserId(req);
  const { id } = req.params;

  const result = await pool.query(
    `delete from alerts where id = $1 and user_id = $2 returning id`,
    [id, userId],
  );

  if (result.rowCount === 0) {
    res.status(404).json({ success: false, error: "Alert not found" });
    return;
  }

  res.json({ success: true, data: { id } });
});

export default router;

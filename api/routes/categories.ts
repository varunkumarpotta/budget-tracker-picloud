import { Router, type Request, type Response } from "express";
import { randomUUID } from "crypto";
import { getPool } from "../db/pool.js";
import { getUserId } from "../middleware/auth.js";

const router = Router();

const DEFAULT_CATEGORIES = [
  { name: "Food", icon: "🍔" },
  { name: "Food Delivery", icon: "🛵" },
  { name: "Groceries", icon: "🛒" },
  { name: "Travel", icon: "✈️" },
  { name: "Shopping", icon: "🛍️" },
  { name: "Subscriptions", icon: "📱" },
  { name: "Health", icon: "💊" },
  { name: "Family", icon: "🏠" },
  { name: "Utilities", icon: "⚡" },
  { name: "Entertainment", icon: "🎬" },
  { name: "Education", icon: "📚" },
  { name: "Rent", icon: "🔑" },
  { name: "Other", icon: "📝" },
];

/**
 * GET /api/v1/categories – list user's categories
 */
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const pool = getPool();
  const userId = getUserId(req);

  const result = await pool.query(
    `select id, name, icon, sort_order, created_at from categories where user_id = $1 order by sort_order asc, name asc`,
    [userId],
  );

  // If user has no categories, seed them
  if (result.rows.length === 0) {
    const defaultData = [];
    let order = 0;
    for (const cat of DEFAULT_CATEGORIES) {
      const id = randomUUID();
      await pool.query(
        `insert into categories (id, user_id, name, icon, sort_order) values ($1, $2, $3, $4, $5) on conflict do nothing`,
        [id, userId, cat.name, cat.icon, order],
      );
      defaultData.push({ id, name: cat.name, icon: cat.icon, sort_order: order });
      order++;
    }
    res.json({
      success: true,
      data: defaultData,
    });
    return;
  }

  res.json({ success: true, data: result.rows });
});

/**
 * PUT /api/v1/categories/reorder – bulk reorder categories
 */
router.put("/reorder", async (req: Request, res: Response): Promise<void> => {
  const pool = getPool();
  const userId = getUserId(req);
  const { ids } = req.body;

  if (!Array.isArray(ids)) {
    res.status(400).json({ success: false, error: "ids must be an array" });
    return;
  }

  for (let i = 0; i < ids.length; i++) {
    await pool.query(
      `update categories set sort_order = $1 where id = $2 and user_id = $3`,
      [i, ids[i], userId]
    );
  }

  res.json({ success: true });
});

/**
 * POST /api/v1/categories – add a category
 */
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const pool = getPool();
  const userId = getUserId(req);
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const icon = typeof req.body?.icon === "string" ? req.body.icon : null;

  if (!name) {
    res.status(400).json({ success: false, error: "Category name is required" });
    return;
  }

  // Check duplicate
  const existing = await pool.query(
    `select id from categories where user_id = $1 and lower(name) = lower($2)`,
    [userId, name],
  );
  if (existing.rows.length > 0) {
    res.status(409).json({ success: false, error: "Category already exists" });
    return;
  }

  // Find max sort order
  const maxOrderRes = await pool.query(
    `select coalesce(max(sort_order), 0) as max_order from categories where user_id = $1`,
    [userId]
  );
  const nextOrder = maxOrderRes.rows[0].max_order + 1;

  const id = randomUUID();
  await pool.query(
    `insert into categories (id, user_id, name, icon, sort_order) values ($1, $2, $3, $4, $5)`,
    [id, userId, name, icon, nextOrder],
  );

  res.status(201).json({ success: true, data: { id, name, icon, sort_order: nextOrder } });
});

/**
 * PUT /api/v1/categories/:id – update a category
 */
router.put("/:id", async (req: Request, res: Response): Promise<void> => {
  const pool = getPool();
  const userId = getUserId(req);
  const { id } = req.params;
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : null;
  const icon = typeof req.body?.icon === "string" ? req.body.icon : undefined;

  if (!name) {
    res.status(400).json({ success: false, error: "Category name is required" });
    return;
  }

  const fields = [`name = $1`];
  const values: unknown[] = [name];
  let idx = 2;

  if (icon !== undefined) {
    fields.push(`icon = $${idx++}`);
    values.push(icon);
  }

  const result = await pool.query(
    `update categories set ${fields.join(", ")} where id = $${idx} and user_id = $${idx + 1} returning id, name, icon, sort_order`,
    [...values, id, userId],
  );

  if (result.rowCount === 0) {
    res.status(404).json({ success: false, error: "Category not found" });
    return;
  }

  res.json({ success: true, data: result.rows[0] });
});

/**
 * DELETE /api/v1/categories/:id – delete a category
 */
router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  const pool = getPool();
  const userId = getUserId(req);
  const { id } = req.params;

  const result = await pool.query(
    `delete from categories where id = $1 and user_id = $2 returning id`,
    [id, userId],
  );

  if (result.rowCount === 0) {
    res.status(404).json({ success: false, error: "Category not found" });
    return;
  }

  res.json({ success: true, data: { id } });
});

/**
 * POST /api/v1/categories/seed – seed default categories for a user
 */
router.post("/seed", async (req: Request, res: Response): Promise<void> => {
  const pool = getPool();
  const userId = getUserId(req);

  const existing = await pool.query(
    `select id from categories where user_id = $1 limit 1`,
    [userId],
  );

  if (existing.rows.length > 0) {
    res.json({ success: true, data: { seeded: false } });
    return;
  }

  let order = 0;
  for (const cat of DEFAULT_CATEGORIES) {
    const id = randomUUID();
    await pool.query(
      `insert into categories (id, user_id, name, icon, sort_order) values ($1, $2, $3, $4, $5) on conflict do nothing`,
      [id, userId, cat.name, cat.icon, order],
    );
    order++;
  }

  res.status(201).json({ success: true, data: { seeded: true } });
});

export default router;

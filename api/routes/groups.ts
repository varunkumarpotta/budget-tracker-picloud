import { Router, type Request, type Response } from "express";
import { randomUUID } from "crypto";
import { getPool } from "../db/pool.js";

const router = Router();

function getUserId(req: Request) {
  const header = req.header("x-user-id");
  if (header) return header;
  return "demo";
}

router.get("/", async (req: Request, res: Response): Promise<void> => {
  const pool = getPool();
  const userId = getUserId(req);

  const result = await pool.query(
    `
      select g.id, g.name, g.created_at
      from groups g
      where g.owner_user_id = $1
      order by g.created_at desc
      limit 100
    `,
    [userId],
  );

  res.json({ success: true, data: result.rows });
});

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const pool = getPool();
  const userId = getUserId(req);
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";

  if (!name) {
    res.status(400).json({ success: false, error: "Group name is required" });
    return;
  }

  const id = randomUUID();
  await pool.query(
    `insert into groups (id, owner_user_id, name) values ($1,$2,$3)`,
    [id, userId, name],
  );

  const memberId = randomUUID();
  await pool.query(
    `insert into group_members (id, group_id, user_id, display_name) values ($1,$2,$3,$4)`,
    [memberId, id, userId, "Me"],
  );

  res.status(201).json({ success: true, data: { id } });
});

export default router;


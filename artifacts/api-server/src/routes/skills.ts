import { Router } from "express";
import { eq, ilike } from "drizzle-orm";
import { db, skillsTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/", async (_req, res) => {
  const skills = await db.select().from(skillsTable).orderBy(skillsTable.category, skillsTable.name);
  res.json(skills);
});

// POST /api/skills — find existing skill by name (case-insensitive) or create a new one
// Used for adding custom skills that are not in the catalog
router.post("/", requireAuth, async (req, res) => {
  const { name, category } = req.body as { name?: string; category?: string };
  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ error: "Skill name is required" });
    return;
  }
  const trimmedName = name.trim();
  const skillCategory = (category?.trim()) || "Custom";

  // Try to find an existing skill with the same name (case-insensitive)
  const [existing] = await db
    .select()
    .from(skillsTable)
    .where(ilike(skillsTable.name, trimmedName));

  if (existing) {
    res.json(existing);
    return;
  }

  // Create a new skill
  const [created] = await db
    .insert(skillsTable)
    .values({ name: trimmedName, category: skillCategory })
    .returning();

  res.status(201).json(created);
});

export default router;

import { Router } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import { signToken, requireAuth } from "../lib/auth";

const router = Router();

router.post("/register", async (req, res) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Validation error" });
    return;
  }
  const { email, password, name, role, university } = parsed.data;

  const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db.insert(usersTable).values({
    email,
    passwordHash,
    name,
    role,
    university: university ?? null,
  }).returning();

  const token = signToken({ userId: user.id, role: user.role, email: user.email });
  res.status(201).json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, university: user.university, avatarUrl: user.avatarUrl, createdAt: user.createdAt },
  });
});

router.post("/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid credentials" });
    return;
  }
  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = signToken({ userId: user.id, role: user.role, email: user.email });
  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, university: user.university, avatarUrl: user.avatarUrl, createdAt: user.createdAt },
  });
});

router.post("/logout", (_req, res) => {
  res.json({ message: "Logged out" });
});

router.get("/me", requireAuth, async (req, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json({ id: user.id, email: user.email, name: user.name, role: user.role, university: user.university, avatarUrl: user.avatarUrl, createdAt: user.createdAt });
});

export default router;

import http from "http";
import path from "path";
import express from "express";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";
import { logger } from "./lib/logger";
import { initSocket } from "./lib/socket";
import { isUserOnline } from "./lib/socket";
import authRoutes from "./routes/auth";
import usersRoutes from "./routes/users";
import freelancersRoutes from "./routes/freelancers";
import skillsRoutes from "./routes/skills";
import portfolioRoutes from "./routes/portfolio";
import projectsRoutes from "./routes/projects";
import applicationsRoutes from "./routes/applications";
import dashboardRoutes from "./routes/dashboard";
import reviewsRoutes from "./routes/reviews";
import messagesRoutes from "./routes/messages";
import notificationsRoutes from "./routes/notifications";
import savedRoutes from "./routes/saved";
import adminRoutes from "./routes/admin";
import reportsRoutes from "./routes/reports";
import uploadsRoutes from "./routes/uploads";
import invitationsRoutes from "./routes/invitations";
import paymentsRoutes from "./routes/payments";
import walletRoutes from "./routes/wallet";
import analyticsRoutes from "./routes/analytics";

// S1: Validate required secrets at startup before anything else
if (!process.env.JWT_SECRET) {
  logger.error("FATAL: JWT_SECRET is not set. Add it to your Replit secrets and restart.");
  process.exit(1);
}

const app = express();
const PORT = parseInt(process.env.PORT ?? "8080", 10);

app.set("trust proxy", 1);

// S3: Restrict CORS to known origins; reflect any origin in development only
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : null;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow same-origin requests (no Origin header) and non-browser clients
      if (!origin) return callback(null, true);
      // In production, require an explicit allow-list — deny unknown origins
      if (IS_PRODUCTION && !ALLOWED_ORIGINS) {
        return callback(new Error("ALLOWED_ORIGINS must be set in production"), false);
      }
      if (ALLOWED_ORIGINS) {
        return callback(null, ALLOWED_ORIGINS.includes(origin));
      }
      // In development (no ALLOWED_ORIGINS set), allow any origin
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(compression());
// S8: Tighten body limit — 1mb is plenty; 10mb was excessive
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());
app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === "/api/healthz" } }));

// S5: Separate, stricter limiter for registration (5 per 15 min per IP)
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many registration attempts, please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", generalLimiter);
app.use("/api/auth", authLimiter);
app.use("/api/auth/register", registerLimiter);

app.get("/api/healthz", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/freelancers", freelancersRoutes);
app.use("/api/skills", skillsRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/applications", applicationsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/saved", savedRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/uploads", uploadsRoutes);
app.use("/api/invitations", invitationsRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/analytics", analyticsRoutes);

// Serve uploaded files as static assets
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Online presence endpoint
app.get("/api/presence", (req, res) => {
  const ids = ((req.query.ids as string) ?? "").split(",").map(Number).filter(n => !isNaN(n));
  const result: Record<number, boolean> = {};
  for (const id of ids) result[id] = isUserOnline(id);
  res.json(result);
});

// Escape text for safe embedding in HTML attributes and text nodes
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

// Open Graph / SEO meta endpoint for project pages
app.get("/og/project/:id", async (req, res) => {
  try {
    const { db, projectsTable, usersTable } = await import("@workspace/db");
    const { eq } = await import("drizzle-orm");
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) { res.status(400).send("Invalid id"); return; }
    const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));
    if (!project) { res.status(404).send("Not found"); return; }
    const [client] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, project.clientId));
    const title = escapeHtml(`${project.title} — SkillMarket AI`);
    const desc = escapeHtml(project.description.slice(0, 200));
    // Build a safe redirect URL using only the numeric id (never interpolate host into JS)
    const safeId = id; // already validated as integer above
    const url = escapeHtml(`${req.protocol}://${req.get("host")}/projects/${safeId}`);
    const authorName = escapeHtml(client?.name ?? "SkillMarket AI");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(`<!DOCTYPE html><html><head>
      <title>${title}</title>
      <meta name="description" content="${desc}">
      <meta property="og:title" content="${title}">
      <meta property="og:description" content="${desc}">
      <meta property="og:url" content="${url}">
      <meta property="og:type" content="website">
      <meta property="og:site_name" content="SkillMarket AI">
      <meta name="twitter:card" content="summary">
      <meta name="twitter:title" content="${title}">
      <meta name="twitter:description" content="${desc}">
      <meta name="author" content="${authorName}">
      <link rel="canonical" href="${url}">
      <meta http-equiv="refresh" content="0; url=${url}">
    </head><body>Redirecting to <a href="${url}">${title}</a></body></html>`);
  } catch (err) {
    logger.error(err);
    res.status(500).send("Error");
  }
});

// In production, serve the built React frontend and handle SPA routing
if (process.env.NODE_ENV === "production") {
  const frontendDist = path.join(process.cwd(), "artifacts/skillmarket/dist");
  app.use(express.static(frontendDist));
  app.get("/{*splat}", (_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
} else {
  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });
}

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const httpServer = http.createServer(app);
initSocket(httpServer);

httpServer.listen(PORT, "0.0.0.0", () => {
  logger.info(`API server listening on port ${PORT}`);
});

export default app;

import express from "express";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";
import { logger } from "./lib/logger";
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

// S1: Validate required secrets at startup before anything else
if (!process.env.JWT_SECRET) {
  logger.error("FATAL: JWT_SECRET is not set. Add it to your Replit secrets and restart.");
  process.exit(1);
}

const app = express();
const PORT = parseInt(process.env.PORT ?? "8080", 10);

app.set("trust proxy", 1);

// S3: Restrict CORS to known origins; reflect any origin in development
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : null;

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow same-origin requests (no Origin header) and non-browser clients
      if (!origin) return callback(null, true);
      // In production, only allow explicitly listed origins
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

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, "0.0.0.0", () => {
  logger.info(`API server listening on port ${PORT}`);
});

export default app;

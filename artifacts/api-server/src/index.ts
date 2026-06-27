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

const app = express();
const PORT = parseInt(process.env.PORT ?? "8080", 10);

app.set("trust proxy", 1);

app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === "/api/healthz" } }));

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

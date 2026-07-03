import express, { type NextFunction, type Request, type Response } from "express";
import authRouter from "./routes/auth.js";
import financeRouter from "./routes/finance.js";
import aiRouter from "./routes/ai.js";
import adminRouter from "./routes/admin.js";
import { isDatabaseConnected } from "./database/mongodb.js";
import { env } from "./config/env.js";

const allowedOrigins = new Set([
  "http://localhost:3000",
  "https://cerulean-rugelach-434913.netlify.app",
  "https://idbi-finance-twin.netlify.app",
  ...env.clientOrigin
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
]);

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use((req, res, next) => {
    const requestOrigin = req.headers.origin;
    if (requestOrigin && (allowedOrigins.has("*") || allowedOrigins.has(requestOrigin))) {
      res.setHeader("Access-Control-Allow-Origin", requestOrigin);
    }
    res.vary("Origin");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  app.get("/api/health", (_req, res) => {
    const database = isDatabaseConnected() ? "connected" : "disconnected";
    res.status(database === "connected" ? 200 : 503).json({
      status: database === "connected" ? "ok" : "degraded",
      database,
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/finance", financeRouter);
  app.use("/api/ai", aiRouter);
  app.use("/api/admin", adminRouter);

  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "API route not found" });
  });

  return app;
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.error("Unhandled request error:", error);
  res.status(500).json({ error: "Internal server error" });
}

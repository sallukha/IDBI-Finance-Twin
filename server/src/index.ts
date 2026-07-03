import path from "node:path";
import express from "express";
import bcrypt from "bcryptjs";
import { createApp, errorHandler } from "./app.js";
import { env } from "./config/env.js";
import { DB } from "./db.js";
import { closeDatabase, connectDatabase } from "./database/mongodb.js";
import { upsertDemoUser } from "./repositories/userRepository.js";

async function startServer() {
  await connectDatabase();
  await DB.initialize();
  await upsertDemoUser({
    id: "user-rahul",
    email: "rahul.me@gmail.com",
    passwordHash: await bcrypt.hash("Rahul@123", 12),
    fullName: "Rahul Sharma",
    age: 26,
    salary: 85000,
    riskLevel: "Low",
    verified: true,
    createdAt: "2026-06-01T00:00:00.000Z",
    isAdmin: false,
    dashboardMetrics: {
      currentBalance: 325000,
      monthlyIncome: 103000,
      monthlyExpenses: 42000,
      monthlySavings: 61000,
      financialHealthScore: 88,
      creditScore: 782,
      emergencyFundMonths: 7,
      investmentValue: 580000,
      netWorth: 980000,
    },
    aiRecommendation: {
      financialHealthScore: 88,
      summary: "Excellent Financial Health",
      recommendation: "Increase SIP investment from ₹15,000 to ₹20,000 to build long-term wealth. Maintain emergency savings equal to 6 months of expenses.",
    },
    fraudAlerts: [
      { title: "Suspicious Transaction", amount: 48000, status: "Blocked", risk: "High" },
    ],
    loanPrediction: {
      eligible: true,
      loanAmount: 1500000,
      emi: 29500,
      affordability: "Safe",
      confidence: 92,
    },
    investments: [
      { type: "Mutual Fund SIP", amount: 15000, returns: "12%" },
      { type: "PPF", amount: 5000, returns: "7.1%" },
      { type: "Gold ETF", amount: 8000, returns: "10%" },
    ],
  });

  const app = createApp();

  if (env.isProduction) {
    const clientDist = path.resolve(process.cwd(), "dist/client");
    app.use(express.static(clientDist, { maxAge: "1d", index: false }));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(clientDist, "index.html"));
    });
  } else {
    const { createServer: createViteServer } = await import("vite");
    const clientRoot = path.resolve(process.cwd(), "client");
    const vite = await createViteServer({
      root: clientRoot,
      configFile: path.join(clientRoot, "vite.config.ts"),
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.use(errorHandler);

  const server = app.listen(env.port, env.host, () => {
    console.log(`FinBuddy AI is running at http://localhost:${env.port}`);
  });

  let shuttingDown = false;
  const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`${signal} received; shutting down gracefully.`);
    server.close(async (error) => {
      if (error) {
        console.error("Server shutdown failed:", error);
        process.exit(1);
      }
      await closeDatabase();
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

startServer().catch((error) => {
  console.error("Critical server startup failure:", error);
  process.exit(1);
});

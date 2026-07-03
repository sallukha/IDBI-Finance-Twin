import path from "node:path";
import express from "express";
import { createApp, errorHandler } from "./app.js";
import { env } from "./config/env.js";
import { DB } from "./db.js";
import { closeDatabase, connectDatabase } from "./database/mongodb.js";
import { migrateLegacyUsers } from "./repositories/userRepository.js";

async function startServer() {
  await connectDatabase();
  await migrateLegacyUsers(DB.data.users);

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

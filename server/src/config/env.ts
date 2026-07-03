import path from "node:path";
import dotenv from "dotenv";

dotenv.config({
  path: [path.resolve(process.cwd(), ".env.local"), path.resolve(process.cwd(), ".env")],
  quiet: true,
});
const nodeEnv = process.env.NODE_ENV ?? "development";
const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be a valid integer between 1 and 65535.");
}
const defaultJwtSecret = "FinBuddyAI_Premium_Secret_2026";
const jwtSecret = process.env.JWT_SECRET ?? defaultJwtSecret;
const mongodbUri = process.env.MONGODB_URI;

if (nodeEnv === "production" && jwtSecret === defaultJwtSecret) {
  throw new Error("JWT_SECRET must be set to a secure value in production.");
}

if (!mongodbUri) {
  throw new Error("MONGODB_URI is required.");
}

export const env = Object.freeze({
  nodeEnv,
  isProduction: nodeEnv === "production",
  port,
  host: process.env.HOST ?? "0.0.0.0",
  jwtSecret,
  mongodbUri,
  mongodbDbName: process.env.MONGODB_DB_NAME ?? "finbuddy",
  geminiApiKey: process.env.GEMINI_API_KEY,
  dataDir: path.resolve(process.cwd(), process.env.DATA_DIR ?? "data"),
});

import {
  MongoClient,
  ServerApiVersion,
  type Collection,
  type Document,
} from "mongodb";
import { env } from "../config/env.js";

let client: MongoClient | null = null;
let connected = false;

export async function connectDatabase(): Promise<void> {
  if (connected) return;

  client = new MongoClient(env.mongodbUri, {
    maxPoolSize: 10,
    minPoolSize: 1,
    serverSelectionTimeoutMS: 10_000,
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  await client.connect();
  await client.db(env.mongodbDbName).command({ ping: 1 });
  connected = true;

  await client
    .db(env.mongodbDbName)
    .collection("users")
    .createIndex({ email: 1 }, { unique: true, name: "users_email_unique" });

  console.log(`MongoDB connected: ${env.mongodbDbName}`);
}

export function getCollection<T extends Document>(name: string): Collection<T> {
  if (!client || !connected) {
    throw new Error("MongoDB has not been connected.");
  }

  return client.db(env.mongodbDbName).collection<T>(name);
}

export function isDatabaseConnected(): boolean {
  return connected;
}

export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close();
  }
  client = null;
  connected = false;
}

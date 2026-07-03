import type { Filter, OptionalId, UpdateFilter } from "mongodb";
import type { User } from "../db.js";
import { getCollection } from "../database/mongodb.js";

type UserUpdate = Partial<Omit<User, "id" | "email" | "createdAt">>;

function users() {
  return getCollection<User>("users");
}

export async function createUser(user: User): Promise<User> {
  await users().insertOne(user as OptionalId<User>);
  return user;
}

export async function upsertDemoUser(user: User): Promise<void> {
  await users().updateOne(
    { email: user.email.trim().toLowerCase() },
    { $set: user },
    { upsert: true },
  );
}

export async function findUserByEmail(email: string): Promise<User | null> {
  return users().findOne(
    { email: email.trim().toLowerCase() },
    { projection: { _id: 0 } },
  );
}

export async function findUserById(id: string): Promise<User | null> {
  return users().findOne({ id }, { projection: { _id: 0 } });
}

export async function listUsers(): Promise<User[]> {
  return users().find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).toArray();
}

export async function updateUser(
  id: string,
  values: UserUpdate,
  unset: Array<keyof User> = [],
): Promise<User | null> {
  const update: UpdateFilter<User> = {};

  if (Object.keys(values).length > 0) {
    update.$set = values;
  }
  if (unset.length > 0) {
    update.$unset = Object.fromEntries(unset.map((field) => [field, ""]));
  }

  return users().findOneAndUpdate(
    { id },
    update,
    { returnDocument: "after", projection: { _id: 0 } },
  );
}

export async function deleteUser(id: string): Promise<boolean> {
  const result = await users().deleteOne({ id });
  return result.deletedCount === 1;
}

export async function migrateLegacyUsers(legacyUsers: User[]): Promise<void> {
  if (legacyUsers.length === 0) return;

  await users().bulkWrite(
    legacyUsers.map((user) => ({
      updateOne: {
        filter: { email: user.email.toLowerCase() } as Filter<User>,
        update: { $setOnInsert: { ...user, email: user.email.toLowerCase() } },
        upsert: true,
      },
    })),
    { ordered: false },
  );
}

export function isDuplicateEmailError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

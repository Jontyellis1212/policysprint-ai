// lib/prisma.ts

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
// better-sqlite3 doesn't ship TypeScript types by default; ignore for TS.
// @ts-ignore
import Database from "better-sqlite3";

// Import PrismaClient via require to avoid TypeScript complaining about types.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require("@prisma/client");

// In dev, keep a single PrismaClient instance across HMR reloads.
// In prod (Vercel), a new client per lambda is fine.
const globalForPrisma = globalThis as unknown as {
  prisma?: any;
};

// Create the SQLite driver instance (local dev DB file)
// This should point to the same DB as your prisma.config.ts datasource.
const sqlite = new Database("dev.db");

// Create the Prisma adapter
const adapter = new PrismaBetterSqlite3(sqlite);

// Create the Prisma client with the adapter
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

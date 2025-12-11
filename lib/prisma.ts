// lib/prisma.ts

import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
// better-sqlite3 doesn't ship TypeScript types by default; ignore for TS.
 // @ts-ignore
import Database from "better-sqlite3";

// Required for hot-reload environments (Next.js dev)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create the SQLite driver instance (local dev DB file)
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

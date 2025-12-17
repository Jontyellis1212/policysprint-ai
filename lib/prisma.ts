// lib/prisma.ts

// IMPORTANT:
// Prisma 7 CANNOT be constructed during Next.js build.
// App Router evaluates API routes at build time.
// We must guard against that.

const isBuildTime =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.NEXT_PHASE === "phase-development-build";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const PrismaClient = !isBuildTime
  ? require("@prisma/client").PrismaClient
  : null;

const globalForPrisma = globalThis as unknown as {
  prisma?: any;
};

export const prisma =
  isBuildTime
    ? (null as any)
    : globalForPrisma.prisma ?? new PrismaClient();

if (!isBuildTime && process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

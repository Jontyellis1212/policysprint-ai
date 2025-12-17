// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Next 16: Turbopack is default. If you use any custom config,
  // include a turbopack block to avoid the build error.
  turbopack: {},

  // Keep native/server-only deps external (Prisma, SQLite, PDF)
  serverExternalPackages: [
    "@prisma/client",
    "prisma",
    "better-sqlite3",
    "pdfkit",
  ],
};

export default nextConfig;

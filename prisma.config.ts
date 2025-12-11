// prisma.config.ts (at project root)

import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // For SQLite in dev:
    url: env("DATABASE_URL"),
  },
});

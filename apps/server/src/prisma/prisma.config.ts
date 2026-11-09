import "dotenv/config";

import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "./schema.prisma",
  migrations: {
    path: "./migrations",
    // Prisma 7 seed command string – runs with ts-node from project root
    seed: "ts-node apps/server/src/prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});


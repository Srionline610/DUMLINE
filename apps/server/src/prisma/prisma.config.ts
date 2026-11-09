import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config();

import { defineConfig } from "prisma/config";

// Resolve database connection URL from environment variables.
// If absent during build time (e.g., Render, Railway, or CI build environments),
// leave undefined so Prisma Client generation succeeds without requiring a live database connection.
const databaseUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;

export default defineConfig({
  schema: "./schema.prisma",
  migrations: {
    path: "./migrations",
    seed: "ts-node apps/server/src/prisma/seed.ts",
  },
  datasource: {
    url: databaseUrl,
  },
});

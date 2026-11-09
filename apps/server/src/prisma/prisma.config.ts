import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config();

import { defineConfig } from "prisma/config";

/**
 * Sanitize the datasource URL for Prisma CLI operations (generate, migrate, seed).
 * Strips accidental wrapping quotes, whitespace, ensures mysql:// scheme,
 * and formats cloud TLS parameters (e.g. sslaccept=strict for TiDB Cloud).
 */
function sanitizePrismaDatasourceUrl(raw?: string): string | undefined {
  if (!raw || typeof raw !== "string") return undefined;
  let str = raw.trim();
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    str = str.slice(1, -1).trim();
  }
  if (!str) return undefined;
  if (str.startsWith("mariadb://")) {
    str = "mysql://" + str.slice("mariadb://".length);
  }

  // Ensure TiDB Cloud and managed cloud databases receive strict SSL parameters for Prisma CLI
  if (str.includes("tidbcloud.com") || str.includes("aivencloud.com")) {
    if (str.includes("ssl=")) {
      str = str.replace(/ssl=\{[^}]+\}/, "sslaccept=strict");
    } else if (!str.includes("sslaccept=")) {
      const sep = str.includes("?") ? "&" : "?";
      str = `${str}${sep}sslaccept=strict`;
    }
  }

  return str;
}

const databaseUrl = sanitizePrismaDatasourceUrl(process.env.DATABASE_URL || process.env.MYSQL_URL);

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

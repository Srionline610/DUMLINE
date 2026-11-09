import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

import { defineConfig } from "prisma/config";

const dbUrl =
  process.env.DATABASE_URL ||
  process.env.MYSQL_URL ||
  "mysql://dumline_user:dumline_dev_password@localhost:3306/dumline_dev";

export default defineConfig({
  schema: "./schema.prisma",
  migrations: {
    path: "./migrations",
    seed: "ts-node apps/server/src/prisma/seed.ts",
  },
  datasource: {
    url: dbUrl,
  },
});

import * as path from 'path';
import * as dotenv from 'dotenv';

// Load root .env regardless of current working directory
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

// Runtime Prisma client used by the application.
const dbUrl = (process.env.DATABASE_URL || process.env.MYSQL_URL || '') as string;
const adapter = new PrismaMariaDb(dbUrl);
export const prisma = new PrismaClient({ adapter });

export default prisma;
